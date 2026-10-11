// Ready-made question sets for the quiz builder's "Add set" menus and for `npm run seed`.
// The first set of each group comes from the original quiz builder (script.js).
// MCQ `correct` is the index of the right option; True/False is "True"/"False";
// Fill-in-the-Blank is the answer text (graded ignoring upper/lower case and extra spaces).

const mcq = (text, options, correct) => ({ type: "MCQ", text, options, correct });
const tf = (text, correct) => ({ type: "TrueFalse", text, correct: correct ? "True" : "False" });
const fib = (text, correct) => ({ type: "FillBlank", text, correct });

export const SAMPLE_GROUPS = {
  mcq: {
    label: "MCQ",
    sets: [
      {
        title: "Web Programming Basics",
        category: "Web Programming",
        questions: [
          mcq("Which HTML element is used to create a hyperlink?", ["Anchor element", "Link (stylesheet) element", "URL element", "Button element"], 0),
          mcq("Which of the following is NOT a CSS position value?", ["absolute", "relative", "fixed", "floating"], 3),
          mcq("Which JavaScript method selects an element by its id?", ["document.getElementById", "document.querySelectorAll", "document.getElementsByClassName", "document.getNode"], 0),
          mcq("In HTML5, which element is used to play video files?", ["media element", "movie element", "video element", "play element"], 2),
          mcq("Which of these is a server-side language?", ["JavaScript", "PHP", "CSS", "HTML"], 1),
        ],
      },
      {
        title: "HTML Essentials",
        category: "HTML",
        questions: [
          mcq("Which tag defines the largest heading?", ["<h6>", "<h1>", "<head>", "<heading>"], 1),
          mcq("Which attribute gives an image alternative text?", ["title", "src", "alt", "longdesc"], 2),
          mcq("Which element creates an unordered (bulleted) list?", ["<ol>", "<ul>", "<li>", "<dl>"], 1),
          mcq("Which input type hides the characters a user types?", ["text", "hidden", "password", "secret"], 2),
          mcq("Which tag inserts a line break?", ["<br>", "<lb>", "<break>", "<hr>"], 0),
        ],
      },
      {
        title: "CSS Styling",
        category: "CSS",
        questions: [
          mcq("Which property changes an element's background colour?", ["color", "bgcolor", "background-color", "fill"], 2),
          mcq('Which selector targets the element with id "main"?', ["#main", ".main", "main", "*main"], 0),
          mcq("Which unit is relative to the root element's font size?", ["em", "rem", "px", "%"], 1),
          mcq("Which display value turns a container into a flexbox?", ["block", "inline", "flex", "static"], 2),
          mcq("Which property adds space inside an element's border?", ["margin", "padding", "spacing", "outline"], 1),
        ],
      },
      {
        title: "JavaScript Fundamentals",
        category: "JS",
        questions: [
          mcq("Which keyword declares a block-scoped variable that cannot be reassigned?", ["var", "let", "const", "static"], 2),
          mcq("What does typeof null return?", ['"null"', '"object"', '"undefined"', '"number"'], 1),
          mcq("Which method adds an element to the end of an array?", ["push()", "pop()", "shift()", "unshift()"], 0),
          mcq("What does JSON.parse() do?", ["Turns an object into a JSON string", "Turns a JSON string into a value", "Validates HTML", "Sends an HTTP request"], 1),
          mcq("Which operator compares without type conversion?", ["==", "=", "===", "!="], 2),
        ],
      },
      {
        title: "C Programming Basics",
        category: "C",
        questions: [
          mcq("Which function prints formatted output in C?", ["printf()", "cout", "print()", "echo"], 0),
          mcq("Which header file declares printf()?", ["<stdlib.h>", "<stdio.h>", "<string.h>", "<math.h>"], 1),
          mcq("Which format specifier prints an int?", ["%f", "%c", "%d", "%s"], 2),
          mcq("Which operator gives the address of a variable?", ["*", "&", "->", "#"], 1),
          mcq("A C program starts running from which function?", ["start()", "main()", "init()", "begin()"], 1),
        ],
      },
      {
        title: "Math Quick Check",
        category: "Math",
        questions: [
          mcq("What is 12 × 12?", ["124", "144", "132", "154"], 1),
          mcq("What is the square root of 81?", ["8", "9", "7", "81"], 1),
          mcq("Which of these is a prime number?", ["21", "27", "29", "33"], 2),
          mcq("What is 15% of 200?", ["15", "20", "30", "45"], 2),
          mcq("What is the sum of the interior angles of a triangle?", ["90°", "180°", "270°", "360°"], 1),
        ],
      },
    ],
  },

  tf: {
    label: "True/False",
    sets: [
      {
        title: "HTML & CSS: True or False",
        category: "HTML",
        questions: [
          tf("CSS stands for Cascading Style Sheets.", true),
          tf("HTML is used for structuring web pages.", true),
          tf("JavaScript can only be executed on the server side.", false),
          tf("The <form> element is used to create interactive forms in HTML.", true),
          tf("In CSS, the '#' symbol is used for selecting classes.", false),
        ],
      },
      {
        title: "JavaScript: True or False",
        category: "JS",
        questions: [
          tf("JavaScript and Java are the same language.", false),
          tf("JavaScript arrays are zero-indexed.", true),
          tf('Variables declared with "let" are block-scoped.', true),
          tf("NaN === NaN evaluates to true.", false),
          tf("A function can be passed as an argument to another function.", true),
        ],
      },
      {
        title: "C++ Concepts: True or False",
        category: "C++",
        questions: [
          tf("C++ supports object-oriented programming.", true),
          tf("Members of a C++ class are public by default.", false),
          tf('The "new" operator allocates memory dynamically in C++.', true),
          tf("C++ does not support function overloading.", false),
          tf('"cout" is declared in the <iostream> header.', true),
        ],
      },
      {
        title: "Science Facts: True or False",
        category: "Science",
        questions: [
          tf("At sea level, water boils at 100 °C.", true),
          tf("The Sun is a planet.", false),
          tf("Sound travels faster than light.", false),
          tf("Plants release oxygen during photosynthesis.", true),
          tf("The chemical symbol for gold is Au.", true),
        ],
      },
      {
        title: "World History: True or False",
        category: "History",
        questions: [
          tf("World War II ended in 1945.", true),
          tf("The Great Wall of China was built within a single decade.", false),
          tf("Neil Armstrong was the first person to walk on the Moon.", true),
          tf("The Roman Empire was founded in the 20th century.", false),
          tf("Bangladesh became independent in 1971.", true),
        ],
      },
    ],
  },

  fib: {
    label: "Fill-in-the-Blank",
    sets: [
      {
        title: "Fill in the Blanks: Web Basics",
        category: "Web Programming",
        questions: [
          fib("The ______ tag in HTML is used to insert an image.", "<img>"),
          fib("JavaScript function to print in console is ______.", "console.log"),
          fib("In CSS, the property to change text color is ______.", "color"),
          fib("The HTML5 tag used for drawing graphics is ______.", "<canvas>"),
          fib("To link an external CSS file, we use the ______ tag.", "<link>"),
        ],
      },
      {
        title: "Fill in the Blanks: CSS Properties",
        category: "CSS",
        questions: [
          fib("The CSS property that makes text bold is ______.", "font-weight"),
          fib("To round the corners of a box, use the ______ property.", "border-radius"),
          fib("The property that controls how transparent an element is: ______.", "opacity"),
          fib("To hide an element and remove it from the layout, set display to ______.", "none"),
          fib("The property that changes the size of text is ______.", "font-size"),
        ],
      },
      {
        title: "Fill in the Blanks: JavaScript Syntax",
        category: "JS",
        questions: [
          fib("To declare a constant in JavaScript, use the keyword ______.", "const"),
          fib("The array method that returns a new array of transformed elements is ______.", "map"),
          fib("The built-in function that converts a string to an integer is ______.", "parseInt"),
          fib("The keyword used to declare a function is ______.", "function"),
          fib("The ______ operator returns the type of a value as a string.", "typeof"),
        ],
      },
      {
        title: "Fill in the Blanks: C Language",
        category: "C",
        questions: [
          fib("The function that reads formatted input in C is ______.", "scanf"),
          fib("The ______ function allocates memory dynamically in C.", "malloc"),
          fib("The keyword that exits a loop immediately is ______.", "break"),
          fib("The ______ operator gives the size of a type or variable in bytes.", "sizeof"),
          fib("Memory allocated with malloc() is released with ______.", "free"),
        ],
      },
      {
        title: "Fill in the Blanks: Math",
        category: "Math",
        questions: [
          fib("7 × 8 = ______", "56"),
          fib("π rounded to two decimal places is ______.", "3.14"),
          fib("A polygon with six sides is called a ______.", "hexagon"),
          fib("2 to the power of 10 equals ______.", "1024"),
          fib("The square root of 144 is ______.", "12"),
        ],
      },
    ],
  },

  mixed: {
    label: "Mixed",
    sets: [
      {
        title: "Mixed Web Quiz",
        category: "JS",
        questions: [
          mcq("Which of the following is a CSS framework?", ["React", "Bootstrap", "Vue", "Angular"], 1),
          tf("HTML tables are created using <table>, <tr>, and <td> tags.", true),
          fib("The ______ attribute in <a> defines the link destination.", "href"),
          mcq("Which HTML tag is used to define a navigation bar?", ["<nav>", "<header>", "<menu>", "<navigation>"], 0),
          tf("In JavaScript, '==' checks both value and type.", false),
        ],
      },
      {
        title: "Mixed HTML & CSS",
        category: "CSS",
        questions: [
          mcq("Which HTML tag links an external stylesheet?", ["<style>", "<link>", "<css>", "<script>"], 1),
          tf("Inline styles normally override rules from an external stylesheet.", true),
          fib("The CSS property that sets the text colour is ______.", "color"),
          mcq("Which property controls the stacking order of positioned elements?", ["z-index", "stack", "order", "layer"], 0),
          tf("<div> is an inline element by default.", false),
        ],
      },
      {
        title: "Mixed C++",
        category: "C++",
        questions: [
          mcq("Which symbol ends a statement in C++?", [";", ":", ".", "!"], 0),
          tf("C++ is case-sensitive.", true),
          fib("The C++ keyword used to define a class is ______.", "class"),
          mcq("Which symbol starts a single-line comment in C++?", ["//", "/*", "#", "--"], 0),
          tf("A C++ constructor has a return type of void.", false),
        ],
      },
      {
        title: "Mixed Science",
        category: "Science",
        questions: [
          mcq("Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Saturn"], 1),
          tf("An adult human skeleton has 206 bones.", true),
          fib("The chemical formula of water is ______.", "H2O"),
          mcq("What is the centre of an atom called?", ["Electron", "Nucleus", "Proton", "Orbit"], 1),
          tf("Light travels faster than sound.", true),
        ],
      },
      {
        title: "General Knowledge Mix",
        category: "General",
        questions: [
          mcq("How many continents are there?", ["5", "6", "7", "8"], 2),
          tf("The Pacific is the largest ocean on Earth.", true),
          fib("The capital city of Bangladesh is ______.", "Dhaka"),
          mcq("How many days are in a leap year?", ["364", "365", "366", "367"], 2),
          tf("A week has eight days.", false),
        ],
      },
    ],
  },
};
