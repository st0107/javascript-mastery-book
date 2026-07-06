# MCQs

1. What does explicit conversion mean?
   - A. Calling a conversion function or parser intentionally, such as `Number(value)`.
   - B. It is only a formatting preference.
   - C. It applies only when code runs in a browser tab.
   - D. It is handled by npm instead of the JavaScript runtime.

   Answer: A. Explanation: Calling a conversion function or parser intentionally, such as `Number(value)`. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

2. What does implicit conversion mean?
   - A. JavaScript converts a value automatically because an operation requires another type.
   - B. It applies only when code runs in a browser tab.
   - C. It is handled by npm instead of the JavaScript runtime.
   - D. It is only a formatting preference.

   Answer: A. Explanation: JavaScript converts a value automatically because an operation requires another type. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

3. Which values are falsy?
   - A. `false`, `0`, `-0`, `0n`, empty string, `null`, `undefined`, and `NaN`.
   - B. It is handled by npm instead of the JavaScript runtime.
   - C. It is only a formatting preference.
   - D. It applies only when code runs in a browser tab.

   Answer: A. Explanation: `false`, `0`, `-0`, `0n`, empty string, `null`, `undefined`, and `NaN`. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

4. Why is strict equality preferred?
   - A. It compares without loose equality coercion.
   - B. It is only a formatting preference.
   - C. It applies only when code runs in a browser tab.
   - D. It is handled by npm instead of the JavaScript runtime.

   Answer: A. Explanation: It compares without loose equality coercion. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

5. What does `Number("")` return?
   - A. It returns `0`, which surprises many developers.
   - B. It applies only when code runs in a browser tab.
   - C. It is handled by npm instead of the JavaScript runtime.
   - D. It is only a formatting preference.

   Answer: A. Explanation: It returns `0`, which surprises many developers. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

6. What does `Boolean("false")` return?
   - A. It returns `true` because non-empty strings are truthy.
   - B. It is handled by npm instead of the JavaScript runtime.
   - C. It is only a formatting preference.
   - D. It applies only when code runs in a browser tab.

   Answer: A. Explanation: It returns `true` because non-empty strings are truthy. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

7. Why should environment booleans be parsed explicitly?
   - A. Environment variables are strings, so `"false"` is truthy unless parsed.
   - B. It is only a formatting preference.
   - C. It applies only when code runs in a browser tab.
   - D. It is handled by npm instead of the JavaScript runtime.

   Answer: A. Explanation: Environment variables are strings, so `"false"` is truthy unless parsed. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

8. What is `NaN` unusual about?
   - A. It is not equal to itself under `===`.
   - B. It applies only when code runs in a browser tab.
   - C. It is handled by npm instead of the JavaScript runtime.
   - D. It is only a formatting preference.

   Answer: A. Explanation: It is not equal to itself under `===`. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

9. How should you test for `NaN`?
   - A. Use `Number.isNaN(value)` for precise checks.
   - B. It is handled by npm instead of the JavaScript runtime.
   - C. It is only a formatting preference.
   - D. It applies only when code runs in a browser tab.

   Answer: A. Explanation: Use `Number.isNaN(value)` for precise checks. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

10. What does object-to-primitive conversion use?
   - A. Methods such as `valueOf`, `toString`, or `Symbol.toPrimitive`.
   - B. It is only a formatting preference.
   - C. It applies only when code runs in a browser tab.
   - D. It is handled by npm instead of the JavaScript runtime.

   Answer: A. Explanation: Methods such as `valueOf`, `toString`, or `Symbol.toPrimitive`. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

11. Why is `== null` sometimes intentionally used?
   - A. It matches only `null` or `undefined`, but it should be documented if used.
   - B. It applies only when code runs in a browser tab.
   - C. It is handled by npm instead of the JavaScript runtime.
   - D. It is only a formatting preference.

   Answer: A. Explanation: It matches only `null` or `undefined`, but it should be documented if used. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

12. What does `parseInt("08px", 10)` return?
   - A. It returns `8` because parsing stops at the non-digit after reading digits.
   - B. It is handled by npm instead of the JavaScript runtime.
   - C. It is only a formatting preference.
   - D. It applies only when code runs in a browser tab.

   Answer: A. Explanation: It returns `8` because parsing stops at the non-digit after reading digits. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

13. Why can `Number("08px")` be safer than `parseInt`?
   - A. It rejects the whole invalid numeric string by producing `NaN`.
   - B. It is only a formatting preference.
   - C. It applies only when code runs in a browser tab.
   - D. It is handled by npm instead of the JavaScript runtime.

   Answer: A. Explanation: It rejects the whole invalid numeric string by producing `NaN`. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

14. What is truthiness useful for?
   - A. Presence checks when all falsy values are truly invalid.
   - B. It applies only when code runs in a browser tab.
   - C. It is handled by npm instead of the JavaScript runtime.
   - D. It is only a formatting preference.

   Answer: A. Explanation: Presence checks when all falsy values are truly invalid. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

15. When is truthiness dangerous?
   - A. When `0`, `false`, or empty string are valid business values.
   - B. It is handled by npm instead of the JavaScript runtime.
   - C. It is only a formatting preference.
   - D. It applies only when code runs in a browser tab.

   Answer: A. Explanation: When `0`, `false`, or empty string are valid business values. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

16. Why do form values need parsing?
   - A. Form controls typically provide strings even for numeric-looking input.
   - B. It is only a formatting preference.
   - C. It applies only when code runs in a browser tab.
   - D. It is handled by npm instead of the JavaScript runtime.

   Answer: A. Explanation: Form controls typically provide strings even for numeric-looking input. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

17. What does `[] == false` demonstrate?
   - A. Loose equality can coerce arrays through primitive conversion and boolean-to-number conversion.
   - B. It applies only when code runs in a browser tab.
   - C. It is handled by npm instead of the JavaScript runtime.
   - D. It is only a formatting preference.

   Answer: A. Explanation: Loose equality can coerce arrays through primitive conversion and boolean-to-number conversion. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

18. What is a boundary parser?
   - A. A function that converts and validates external data before internal use.
   - B. It is handled by npm instead of the JavaScript runtime.
   - C. It is only a formatting preference.
   - D. It applies only when code runs in a browser tab.

   Answer: A. Explanation: A function that converts and validates external data before internal use. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

19. Why should coercion edge cases be learned?
   - A. They reveal the deterministic rules behind surprising interview prompts.
   - B. It is only a formatting preference.
   - C. It applies only when code runs in a browser tab.
   - D. It is handled by npm instead of the JavaScript runtime.

   Answer: A. Explanation: They reveal the deterministic rules behind surprising interview prompts. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

20. What is the safest API design?
   - A. Accept clear types internally and convert only at boundaries.
   - B. It applies only when code runs in a browser tab.
   - C. It is handled by npm instead of the JavaScript runtime.
   - D. It is only a formatting preference.

   Answer: A. Explanation: Accept clear types internally and convert only at boundaries. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.

21. What should a coercion interview answer include?
   - A. The conversion path, the resulting value, and the production lesson.
   - B. It is handled by npm instead of the JavaScript runtime.
   - C. It is only a formatting preference.
   - D. It applies only when code runs in a browser tab.

   Answer: A. Explanation: The conversion path, the resulting value, and the production lesson. This is directly relevant to Type Conversion and Coercion because the topic is about predictable behavior, not memorized trivia.
