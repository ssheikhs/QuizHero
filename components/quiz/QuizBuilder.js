"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { createQuiz, updateQuiz } from "@/app/instructor/quizzes/actions";
import { callAction } from "@/lib/call-action";
import { fieldErrors, LIMITS, quizSchema, TYPE_LABELS } from "@/lib/quiz-schema";
import { SAMPLE_GROUPS } from "@/lib/sample-sets.mjs";

let keySeq = 0;
const nextKey = () => `q${++keySeq}`;

function blankQuestion(type = "MCQ") {
  if (type === "MCQ") return { key: nextKey(), type, text: "", options: ["", ""], correct: 0 };
  if (type === "TrueFalse") return { key: nextKey(), type, text: "", correct: "True" };
  return { key: nextKey(), type, text: "", correct: "" };
}

/** Builder state → the shape quizSchema / the server action expects. */
function toPayload(form) {
  return {
    title: form.title,
    timeLimitMin: Number.isFinite(Number(form.timeLimitMin)) && form.timeLimitMin !== "" ? Number(form.timeLimitMin) : NaN,
    categoryId: form.categoryId,
    shuffle: form.shuffle,
    shuffleOptions: form.shuffleOptions,
    questionsPerStudent: form.questionsPerStudent === "" || form.questionsPerStudent == null ? null : Number(form.questionsPerStudent),
    questions: form.questions.map(({ key: _key, ...q }) => {
      if (q.type === "MCQ") return { id: q.id, type: q.type, text: q.text, options: q.options, correct: q.correct };
      return { id: q.id, type: q.type, text: q.text, correct: q.correct };
    }),
  };
}

export default function QuizBuilder({ categories, initial }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(() => ({
    title: initial?.title ?? "",
    timeLimitMin: initial?.timeLimitMin ?? 5,
    categoryId: initial?.categoryId ?? (categories.find((c) => c.name === "General") ?? categories[0])?.id ?? "",
    shuffle: initial?.shuffle ?? true,
    shuffleOptions: initial?.shuffleOptions ?? true,
    questionsPerStudent: initial?.questionsPerStudent ?? "",
    questions: initial ? initial.questions.map((q) => ({ ...q, key: nextKey() })) : [blankQuestion()],
  }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const listEnd = useRef(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setQuestion = (index, patch) =>
    setForm((f) => ({ ...f, questions: f.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) }));

  const isUntouched = (q) => q.type === "MCQ" && !q.text.trim() && !q.options.some((o) => o.trim());

  function addQuestions(questions, { replaceUntouched = false } = {}) {
    setErrors({}); // error keys are by question index, so they'd point at the wrong question after this
    // A sample set replaces the empty starter question instead of leaving it above the set.
    setForm((f) => ({ ...f, questions: [...(replaceUntouched ? f.questions.filter((q) => !isUntouched(q)) : f.questions), ...questions] }));
    setTimeout(() => listEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
  }

  function addSampleSets(sets, title) {
    const questions = sets.flatMap((set) => set.questions);
    addQuestions(
      questions.map((q) => ({ ...q, options: q.options ? [...q.options] : undefined, key: nextKey() })),
      { replaceUntouched: true },
    );
    if (!form.title.trim()) setForm((f) => ({ ...f, title }));
    // Pre-select the set's category for a brand-new quiz (only when one set is added).
    const category = sets.length === 1 && categories.find((c) => c.name === sets[0].category);
    if (category && !isEdit) setForm((f) => ({ ...f, categoryId: category.id }));
    toast.success(`Added ${questions.length} questions`);
    document.activeElement?.blur(); // close the dropdown
  }

  function changeType(index, type) {
    setErrors({});
    const { text, id, key } = form.questions[index];
    setQuestion(index, { ...blankQuestion(type), text, id, key });
  }

  function move(index, delta) {
    setErrors({});
    setForm((f) => {
      const questions = [...f.questions];
      const target = index + delta;
      if (target < 0 || target >= questions.length) return f;
      [questions[index], questions[target]] = [questions[target], questions[index]];
      return { ...f, questions };
    });
  }

  function removeQuestion(index) {
    const q = form.questions[index];
    if ((q.text.trim() || q.options?.some(Boolean)) && !confirm("Remove this question?")) return;
    setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== index) }));
    setErrors({});
  }

  async function save(publish) {
    const payload = toPayload(form);
    const check = quizSchema.safeParse(payload);
    if (!check.success) {
      setErrors(fieldErrors(check.error));
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setBusy(true);
    const result = isEdit
      ? await callAction(updateQuiz, initial.id, payload, { publish })
      : await callAction(createQuiz, payload, { publish });
    setBusy(false);

    if (!result?.ok) {
      setErrors(result?.fields ?? {});
      toast.error(result?.error ?? "Could not save the quiz.");
      return;
    }
    toast.success(result.accessCode ? `Published! Access code: ${result.accessCode}` : isEdit ? "Quiz updated" : "Quiz saved as draft", {
      duration: result.accessCode ? 6000 : 3500,
    });
    router.push("/instructor/quizzes");
    router.refresh();
  }

  const err = (key) => errors[key];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(isEdit && initial.published);
      }}
      className="space-y-6"
      noValidate
    >
      {/* Quiz details */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body grid gap-4 md:grid-cols-2">
          <fieldset className="fieldset md:col-span-2">
            <legend className="fieldset-legend">Quiz title</legend>
            <input
              className={`input w-full ${err("title") ? "input-error" : ""}`}
              value={form.title}
              maxLength={LIMITS.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Web Programming Basics"
            />
            {err("title") && <p className="label text-error">{err("title")}</p>}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Time limit (minutes)</legend>
            <input
              type="number"
              min={1}
              max={LIMITS.maxMinutes}
              className={`input w-full ${err("timeLimitMin") ? "input-error" : ""}`}
              value={form.timeLimitMin}
              onChange={(e) => set({ timeLimitMin: e.target.value })}
            />
            {err("timeLimitMin") && <p className="label text-error">{err("timeLimitMin")}</p>}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Category</legend>
            <select
              className={`select w-full ${err("categoryId") ? "select-error" : ""}`}
              value={form.categoryId}
              onChange={(e) => set({ categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {err("categoryId") && <p className="label text-error">{err("categoryId")}</p>}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Questions per student (optional)</legend>
            <input
              type="number"
              min={1}
              max={form.questions.length}
              className={`input w-full ${err("questionsPerStudent") ? "input-error" : ""}`}
              value={form.questionsPerStudent}
              placeholder={`All ${form.questions.length}`}
              onChange={(e) => set({ questionsPerStudent: e.target.value })}
            />
            {err("questionsPerStudent") ? (
              <p className="label text-error">{err("questionsPerStudent")}</p>
            ) : (
              <p className="label whitespace-normal">
                {form.questionsPerStudent
                  ? `Each student gets ${form.questionsPerStudent} random questions from this pool of ${form.questions.length}.`
                  : "Leave empty to give every student all questions."}
              </p>
            )}
          </fieldset>

          <div className="flex flex-col justify-center gap-3">
            <label className="label cursor-pointer gap-3">
              <input type="checkbox" className="toggle toggle-primary" checked={form.shuffle} onChange={(e) => set({ shuffle: e.target.checked })} />
              <span className="whitespace-normal">Randomize question order for each student</span>
            </label>
            <label className="label cursor-pointer gap-3">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={form.shuffleOptions}
                onChange={(e) => set({ shuffleOptions: e.target.checked })}
              />
              <span className="whitespace-normal">Shuffle MCQ answer options for each student</span>
            </label>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">
            Questions <span className="badge badge-primary badge-soft">{form.questions.length}</span>
          </h2>
          {err("questions") && <p className="text-sm text-error">{err("questions")}</p>}
        </div>

        {form.questions.map((q, index) => (
          <QuestionCard
            key={q.key}
            index={index}
            question={q}
            total={form.questions.length}
            err={(field) => err(`questions.${index}${field ? `.${field}` : ""}`)}
            onChange={(patch) => setQuestion(index, patch)}
            onType={(type) => changeType(index, type)}
            onMove={(delta) => move(index, delta)}
            onRemove={() => removeQuestion(index)}
          />
        ))}
        <div ref={listEnd} />

        <div className="flex flex-wrap justify-center gap-2 rounded-box border border-dashed border-base-300 bg-base-100 p-4">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => addQuestions([blankQuestion()])}>
            + Add Question
          </button>
          {Object.entries(SAMPLE_GROUPS).map(([key, group]) => (
            <div key={key} className="dropdown dropdown-top dropdown-center">
              <button type="button" tabIndex={0} className="btn btn-outline btn-primary btn-sm">
                + {group.label} sets ▾
              </button>
              <ul tabIndex={0} className="menu dropdown-content z-20 mb-2 w-72 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
                <li className="menu-title">{group.label} question sets</li>
                {group.sets.map((set) => (
                  <li key={set.title}>
                    <button type="button" onClick={() => addSampleSets([set], set.title)}>
                      <span className="flex-1 text-left">{set.title}</span>
                      <span className="badge badge-ghost badge-sm">{set.questions.length}</span>
                    </button>
                  </li>
                ))}
                <li className="mt-1 border-t border-base-300 pt-1">
                  <button type="button" className="font-semibold text-primary" onClick={() => addSampleSets(group.sets, `${group.label} Question Pool`)}>
                    Add all {group.sets.length} sets ({group.sets.reduce((n, s) => n + s.questions.length, 0)} questions)
                  </button>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap justify-end gap-2 border-t border-base-300 bg-base-200/95 px-4 py-3 backdrop-blur">
        <Link href="/instructor/quizzes" className="btn btn-ghost">
          Cancel
        </Link>
        {isEdit && initial.published ? (
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy && <span className="loading loading-spinner loading-sm" />} Save changes
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-outline" disabled={busy} onClick={() => save(false)}>
              {busy && <span className="loading loading-spinner loading-sm" />} {isEdit ? "Save draft" : "Save as draft"}
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => save(true)}>
              {busy && <span className="loading loading-spinner loading-sm" />} Save &amp; publish
            </button>
          </>
        )}
      </div>
    </form>
  );
}

function QuestionCard({ index, question: q, total, err, onChange, onType, onMove, onRemove }) {
  const setOption = (i, value) => onChange({ options: q.options.map((o, j) => (j === i ? value : o)) });
  const addOption = () => onChange({ options: [...q.options, ""] });
  const removeOption = (i) =>
    onChange({
      options: q.options.filter((_, j) => j !== i),
      correct: q.correct === i ? 0 : q.correct > i ? q.correct - 1 : q.correct,
    });

  return (
    <div className={`card border bg-base-100 shadow-sm ${err() ? "border-error" : "border-base-300"}`}>
      <div className="card-body gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">Question {index + 1}</h3>
          <div className="flex flex-wrap items-center gap-1">
            <select className="select select-sm w-44" value={q.type} onChange={(e) => onType(e.target.value)} aria-label="Question type">
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-ghost btn-sm btn-square" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up">
              ↑
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-square" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Move down">
              ↓
            </button>
            <button type="button" className="btn btn-ghost btn-sm text-error" onClick={onRemove}>
              Remove
            </button>
          </div>
        </div>

        <div>
          <textarea
            className={`textarea w-full ${err("text") ? "textarea-error" : ""}`}
            rows={2}
            maxLength={LIMITS.text}
            placeholder={q.type === "FillBlank" ? "e.g. The ______ tag inserts an image." : "Question text"}
            value={q.text}
            onChange={(e) => onChange({ text: e.target.value })}
          />
          {err("text") && <p className="mt-1 text-sm text-error">{err("text")}</p>}
        </div>

        {q.type === "MCQ" && (
          <div className="space-y-2">
            <p className="text-sm opacity-70">Options — select the correct one:</p>
            {q.options.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  className="radio radio-success radio-sm"
                  name={`correct-${q.key}`}
                  checked={q.correct === i}
                  onChange={() => onChange({ correct: i })}
                  aria-label={`Mark option ${String.fromCharCode(65 + i)} correct`}
                />
                <span className="w-5 font-semibold">{String.fromCharCode(65 + i)}.</span>
                <input
                  className={`input input-sm w-full ${err(`options.${i}`) ? "input-error" : ""}`}
                  value={option}
                  maxLength={LIMITS.option}
                  placeholder={`Option ${i + 1}`}
                  onChange={(e) => setOption(i, e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-square"
                  disabled={q.options.length <= LIMITS.minOptions}
                  onClick={() => removeOption(i)}
                  aria-label="Remove option"
                >
                  ✕
                </button>
              </div>
            ))}
            {(err("options") || err("correct")) && <p className="text-sm text-error">{err("options") || err("correct")}</p>}
            {q.options.some((_, i) => err(`options.${i}`)) && <p className="text-sm text-error">Options can&apos;t be empty.</p>}
            {q.options.length < LIMITS.maxOptions && (
              <button type="button" className="btn btn-ghost btn-xs" onClick={addOption}>
                + Add option
              </button>
            )}
          </div>
        )}

        {q.type === "TrueFalse" && (
          <div className="flex items-center gap-6">
            <span className="text-sm opacity-70">Correct answer:</span>
            {["True", "False"].map((value) => (
              <label key={value} className="flex cursor-pointer items-center gap-2">
                <input type="radio" className="radio radio-success radio-sm" name={`tf-${q.key}`} checked={q.correct === value} onChange={() => onChange({ correct: value })} />
                {value}
              </label>
            ))}
          </div>
        )}

        {q.type === "FillBlank" && (
          <div>
            <input
              className={`input input-sm w-full ${err("correct") ? "input-error" : ""}`}
              value={q.correct}
              maxLength={LIMITS.answer}
              placeholder="Correct answer (graded ignoring upper/lower case and extra spaces)"
              onChange={(e) => onChange({ correct: e.target.value })}
            />
            {err("correct") && <p className="mt-1 text-sm text-error">{err("correct")}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
