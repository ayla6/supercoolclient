import { login } from "../../login";
import { elem } from "../utils/elem";
import { popupBox } from "./dialog";

export const loginDialog = async () => {
  const identifier = elem("input", {
    type: "text",
    placeholder: "Username",
    className: "login-input",
  });

  const password = elem("input", {
    type: "password",
    placeholder: "*App* Password",
    className: "login-input",
  });

  const handleLogin = () => {
    login({
      identifier: identifier.value,
      password: password.value,
    });
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  identifier.addEventListener("keypress", handleKeyPress);
  password.addEventListener("keypress", handleKeyPress);

  const content = elem("div", { className: "popup login-popup" }, null, [
    elem("span", {
      className: "title",
      textContent: "Sign in",
    }),

    elem("div", { className: "field" }, null, [identifier]),

    elem("div", { className: "field" }, null, [password]),

    elem("div", { className: "dialog-options" }, null, [
      elem("button", {
        textContent: "Cancel",
        onclick: () => dialog.cleanup(),
      }),
      elem("button", {
        textContent: "Login",
        className: "accent-button",
        onclick: handleLogin,
      }),
    ]),
  ]);

  const dialog = popupBox(content);
  return dialog;
};
