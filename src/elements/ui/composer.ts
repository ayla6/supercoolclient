import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import { manager, privateKey, rpc, sessionData } from "../../login";
import { elem } from "../utils/elem";
import { postCard } from "./post_card";
import {
  confirmDialog,
  doubleTextDialog,
  popupBox,
  selectDialog,
} from "./dialog";
import { uploadImages } from "./composer-embeds/image";
import { uploadVideo } from "./composer-embeds/video";
import { changeImageFormat, isUrl, toShortUrl } from "../utils/link_processing";
import { language_codes } from "../utils/language_codes";
import { PostMediaEmbed, publishThread } from "@atcute/bluesky-threading";
import { createTray } from "./tray";
import { ageEncrypt } from "../utils/encryption";
import { Facet } from "@atcute/bluesky-richtext-segmenter";
import { buildRichText, getTextLength } from "../utils/composer";

const MAX_TEXT_LENGTH = {
  normal: 300,
  encrypted: 4096,
};

export const composerBox = (
  reply?: AppBskyFeedDefs.PostView,
  quote?: AppBskyFeedDefs.PostView,
  ageEncrypted: boolean = false,
) => {
  const background = elem("div", { className: "background" });

  interface ImageWithURL {
    file: File;
    objectURL: string;
    altText?: string;
  }
  let images: ImageWithURL[][] = [];
  let video: File;

  let textboxes: HTMLDivElement[] = [];
  let imagePreviews: HTMLDivElement[] = [];
  let selectedTextbox: HTMLDivElement;
  let cleaning = false;

  const charCounter = elem("div", { className: "char-counter" });
  const wheel = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  wheel.setAttribute("width", "30");
  wheel.setAttribute("height", "30");
  wheel.setAttribute("viewBox", "0 0 30 30");

  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  circle.setAttribute("cx", "15");
  circle.setAttribute("cy", "15");
  circle.setAttribute("r", "12");
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke-width", "3");
  circle.setAttribute("transform", "rotate(-90 15 15)");

  const outlineCircle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  outlineCircle.setAttribute("cx", "15");
  outlineCircle.setAttribute("cy", "15");
  outlineCircle.setAttribute("r", "12");
  outlineCircle.setAttribute("fill", "none");
  outlineCircle.setAttribute("stroke-width", "3");
  outlineCircle.setAttribute("stroke", "#ddd");

  const countText = elem("span", { className: "count-text" });
  wheel.appendChild(outlineCircle);
  wheel.appendChild(circle);
  charCounter.append(countText, wheel);

  const updateCharCount = (textbox?: HTMLDivElement) => {
    const text = textbox?.textContent || "";
    const count = getTextLength(text);
    const maxCount = ageEncrypted
      ? MAX_TEXT_LENGTH.encrypted
      : MAX_TEXT_LENGTH.normal;
    const percent = Math.min((count / maxCount) * 100, 100);

    circle.style.strokeDasharray = `${(percent * 75.4) / 100} 75.4`;
    countText.textContent = `${maxCount - count}`;

    if (count > maxCount) {
      circle.style.stroke = "#d32f2f";
    } else {
      circle.style.stroke = "var(--accent-color)";
    }
  };
  updateCharCount();

  // Image handling functions
  const updateImagePreviews = () => {
    const selectedTextAreaIndex = textboxes.indexOf(selectedTextbox);
    const imagePreview = imagePreviews[selectedTextAreaIndex];
    imagePreview.innerHTML = "";
    images[selectedTextAreaIndex].forEach((image, index) => {
      imagePreview.appendChild(
        elem("div", { className: "image" }, null, [
          elem("img", {
            src: image.objectURL,
            onclick: async () => {
              const altTextBox = elem("div", {
                className: "text-box",
                role: "textbox",
                contentEditable: "true",
                translate: false,
                ariaPlaceholder: "describe the image here please",
                innerText: image.altText ?? "",
              });
              await new Promise<boolean>((resolve) => {
                const content = elem("div", { className: "popup" }, null, [
                  elem("span", {
                    className: "section-title",
                    textContent: "Add alt text",
                  }),
                  elem("div", { className: "settings-holder" }, undefined, [
                    elem("div", { className: "setting" }, undefined, [
                      altTextBox,
                    ]),
                  ]),
                  elem("div", { className: "dialog-options" }, null, [
                    elem("button", {
                      textContent: "Cancel",
                      onclick: () => {
                        resolve(false);
                        dialog.cleanup();
                      },
                    }),
                    elem("button", {
                      textContent: "Save",
                      onclick: async () => {
                        image.altText = altTextBox.innerText;
                        resolve(true);
                        dialog.cleanup();
                      },
                    }),
                  ]),
                ]);
                const dialog = popupBox(content, () => resolve(false));
              });
            },
          }),
          elem("button", {
            textContent: "×",
            className: "close-button",
            onclick: () => {
              URL.revokeObjectURL(image.objectURL);
              images.splice(index, 1);
              updateImagePreviews();
            },
          }),
        ]),
      );
    });
  };

  const handleImageInput = (files: FileList) => {
    const remainingSlots = 4 - images.length;
    const newFiles = Array.from(files).slice(0, remainingSlots);
    const newImages = newFiles.map((file) => ({
      file,
      objectURL: URL.createObjectURL(file),
    }));
    images[textboxes.indexOf(selectedTextbox)].push(...newImages);
    updateImagePreviews();
  };

  const createFileInput = (
    type: string,
    multiple: boolean,
    handler: (files: FileList) => void,
  ) => {
    const input = elem("input", {
      type: "file",
      accept: `${type}/*`,
      multiple,
    });
    input.addEventListener("change", () => input.files && handler(input.files));
    return input;
  };

  let posting = false;
  // Post creation
  const createPost = async () => {
    if (posting) {
      return;
    }
    let error = false;
    // prettier-ignore
    if (!textboxes.every((textbox, index) => textbox.innerText?.trim() || images[index]?.length)) {
      createTray('Some posts are empty!')
      error = true;
    }
    if (ageEncrypted) {
      if (textboxes.length > 1) {
        createTray("Threading on encrypted posts is not supported yet!");
        error = true;
      }
      if (textboxes.some((textbox, index) => images[index]?.length)) {
        createTray("Images are not supported on encrypted posts yet!");
        error = true;
      }
    }
    if (
      !textboxes.every((textbox, index) => {
        const text = textbox.innerText?.trim() || "";
        const maxCount = ageEncrypted
          ? MAX_TEXT_LENGTH.encrypted
          : MAX_TEXT_LENGTH.normal;
        return [...text].length <= maxCount;
      })
    ) {
      createTray("Some posts are too long!");
      error = true;
    }
    if (error) return;

    let media: PostMediaEmbed[] = [];
    if (!ageEncrypted) {
      for (let i = 0; i < images.length; i++) {
        if (images[i].length) media[i] = await uploadImages(images[i]);
      }
    }

    const texts: { text: string; facets: Facet[] }[] = [];
    for (const textbox of textboxes) {
      texts.push(await buildRichText(textbox.innerText || ""));
    }

    //if (video) embed = await uploadVideo(video);
    try {
      posting = true;
      postButton.disabled = true;
      postButton.classList.add("disabled");

      if (!ageEncrypted) {
        await publishThread(rpc, {
          reply,
          author: manager.session.did,
          languages: [language],
          posts: textboxes.map((textbox, i) => ({
            content: texts[i],
            embed: {
              record:
                i === 0 && quote
                  ? { type: "quote", uri: quote.uri, cid: quote.cid }
                  : undefined,
              media: media?.[i],
            },
          })),
        });
      } else {
        await rpc.call("com.atproto.repo.createRecord", {
          data: {
            repo: sessionData.did,
            collection: "app.bsky.feed.post",
            record: {
              $type: "app.bsky.feed.post",
              reply: reply
                ? {
                    root: (reply.record as AppBskyFeedPost.Record).reply
                      ? {
                          cid: (reply.record as AppBskyFeedPost.Record).reply
                            .root.cid,
                          uri: (reply.record as AppBskyFeedPost.Record).reply
                            .root.uri,
                        }
                      : {
                          cid: reply.cid,
                          uri: reply.uri,
                        },
                    parent: {
                      cid: reply.cid,
                      uri: reply.uri,
                    },
                  }
                : undefined,
              createdAt: new Date().toISOString(),
              text: "AGE ENCRYPTED POST",
              "dev.pages.supercoolclient.secret": await ageEncrypt(
                JSON.stringify(texts[0]),
              ),
            } as AppBskyFeedPost.Record,
          },
        });
      }

      createTray("Your post was published!");

      cleanup(true);
    } catch (e) {
      posting = false;
      postButton.disabled = false;
      postButton.classList.remove("disabled");

      createTray(e);
    }
  };

  // Cleanup function
  const cleanup = async (override?: boolean) => {
    if (cleaning) return;
    cleaning = true;

    const hasContent =
      textboxes.some((textbox) => textbox.innerText) ||
      images.some((imageGroup) => imageGroup.length > 0);
    const result =
      !hasContent || override
        ? true
        : await confirmDialog("Do you want to discard this draft?", "Discard");
    if (result) {
      document.removeEventListener("keydown", escapeKeyHandler);
      images.forEach((imageGroup) =>
        imageGroup.forEach((image) => URL.revokeObjectURL(image.objectURL)),
      );
      background.remove();
    }
    cleaning = false;
    return result;
  };

  const createTextArea = () => {
    const textbox = elem("div", {
      className: "text-box",
      role: "textbox",
      contentEditable: "true",
      translate: false,
      ariaPlaceholder: reply ? "Type your reply" : "Say anything you want",
    });
    textbox.addEventListener("input", () => updateCharCount(textbox));
    textbox.addEventListener("paste", (e) => {
      const files = Array.from(e.clipboardData?.items || [])
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter(Boolean);

      if (files.length) {
        e.preventDefault();
        if (images?.length >= 4) return;
        handleImageInput(files as unknown as FileList);
      } else {
        e.preventDefault();
        let text = e.clipboardData.getData("text/plain");
        const url = isUrl(text);
        if (url) text = `[${toShortUrl(url.href)}](${url.href})`;
        // yeah it sucks that i have to use a deprecated thing
        document.execCommand("insertText", false, text);
        updateCharCount(textbox);
      }
    });
    textbox.addEventListener("focus", () => {
      selectedTextbox = textbox;
      updateCharCount(textbox);
      textAreasHolder
        .querySelectorAll(".post-container")
        .forEach((container) => container.classList.remove("focus"));
      container.classList.add("focus");
    });

    textbox.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault(); // Prevent default newline behavior
        createPost();
      }
    });

    const imagePreview = elem("div", { className: "image-preview" });

    const removeButton = elem("button", {
      textContent: "×",
      className: "remove-post-button",
      onclick: () => {
        const index = textboxes.indexOf(textbox);
        if (index > -1) {
          images[index].forEach((image) =>
            URL.revokeObjectURL(image.objectURL),
          );
          textboxes.splice(index, 1);
          imagePreviews.splice(index, 1);
          images.splice(index, 1);
          container.remove();
        }
        textboxes[Math.max(index - 1, 0)].focus();
      },
    });

    textboxes.push(textbox);
    imagePreviews.push(imagePreview);
    images.push([]);

    const container = elem("div", { className: "post-container" }, undefined, [
      elem("div", { className: "text-area" }, undefined, [
        elem("div", { className: "avatar-area" }, undefined, [
          elem("img", { src: changeImageFormat(sessionData.avatar) }),
        ]),
        textbox,
        removeButton,
      ]),
      imagePreview,
    ]);
    return container;
  };

  // UI Elements
  const textAreasHolder = elem(
    "div",
    { className: "text-areas-holder" },
    createTextArea(),
  );

  const postButton = elem("button", {
    className: "accent-button",
    textContent: "Post",
    onclick: () => createPost(),
  });

  const cancelButton = elem("button", {
    textContent: "Cancel",
    onclick: () => {
      cleanup();
    },
  });

  const addPostButton = elem("button", {
    textContent: "+",
    className: "square",
    onclick: () => {
      textAreasHolder.append(createTextArea());
      textboxes.at(-1)?.focus();
    },
  });

  const imageButton = elem("button", {
    textContent: "🖼️",
    className: "square",
    onclick: () => createFileInput("image", true, handleImageInput).click(),
  });

  const videoButton = elem("button", {
    textContent: "📽️",
    className: "square",
    onclick: () =>
      createFileInput("video", false, (files) => (video = files[0])).click(),
  });

  const languageButtons = elem("div", { className: "language-buttons" });
  const languages = JSON.parse(
    localStorage.getItem("composer-langs") || '["en"]',
  );
  localStorage.setItem("composer-langs", JSON.stringify(languages));
  let language = localStorage.getItem("last-selected-lang") || languages[0];

  const handleLangClick = (lang: string) => {
    language = lang;
    localStorage.setItem("last-selected-lang", lang);
    languageButtons
      .querySelectorAll(".lang-button-container")
      .forEach((btn) =>
        btn.classList.toggle(
          "active",
          btn.querySelector("button")?.textContent === lang.toUpperCase(),
        ),
      );
  };

  const handleLangRemove = async (lang: string, container: HTMLElement) => {
    if (languages.length > 1) {
      const confirmed = await confirmDialog("Remove this language?", "Remove");
      if (confirmed) {
        languages.splice(languages.indexOf(lang), 1);
        localStorage.setItem("composer-langs", JSON.stringify(languages));
        container.remove();
        if (language === lang) {
          language = languages[0];
          localStorage.setItem("last-selected-lang", language);
          languageButtons.firstElementChild?.classList.add("active");
        }
      }
    }
  };

  const createLanguageButton = (lang: string) => {
    const container = elem("div", {
      className: `lang-button-container${lang === language ? " active" : ""}`,
    });
    container.append(
      elem("button", {
        textContent: lang.toUpperCase(),
        onclick: () => handleLangClick(lang),
      }),
      elem("span", {
        className: "remove-lang",
        textContent: "×",
        onclick: (e) => {
          e.stopPropagation();
          handleLangRemove(lang, container);
        },
      }),
    );
    return container;
  };

  languages.forEach((lang: string) => {
    languageButtons.appendChild(createLanguageButton(lang));
  });

  languageButtons.appendChild(
    elem("button", {
      textContent: "+",
      className: "square",
      onclick: async () => {
        const newLangName = await selectDialog(
          "Select language to add",
          language_codes.map((lang) => lang.name),
          "Add",
        );
        const newLang = language_codes.find(
          (code) => code.name === newLangName,
        )?.code;
        if (newLang && !languages.includes(newLang)) {
          languages.push(newLang);
          languageButtons.insertBefore(
            createLanguageButton(newLang),
            languageButtons.lastElementChild,
          );
          localStorage.setItem("composer-langs", JSON.stringify(languages));
        }
      },
    }),
  );

  const lockButton = elem("button", {
    textContent: ageEncrypted ? "🔒" : "🔓",
    className: "square",
    onclick: () => {
      ageEncrypted = !ageEncrypted;
      lockButton.textContent = ageEncrypted ? "🔒" : "🔓";
      lockButton.style.backgroundColor = ageEncrypted ? "#00ff00" : "#ff0000";
      updateCharCount(selectedTextbox);
    },
  });
  lockButton.style.background = ageEncrypted ? "#00ff00" : "#ff0000";

  const composer = elem("div", { className: "composer" }, null, [
    reply &&
      elem("div", { className: "embeds" }, postCard(reply, { isEmbed: true })),
    textAreasHolder,
    quote &&
      elem("div", { className: "embeds" }, postCard(quote, { isEmbed: true })),
    elem("div", { className: "horizontal-buttons space-between" }, null, [
      elem("div", {}, null, [
        privateKey ? lockButton : undefined,
        imageButton,
        languageButtons,
      ]),
      addPostButton,
      //videoButton,
    ]),
    elem("div", { className: "horizontal-buttons space-between" }, null, [
      cancelButton,
      elem("div", {}, null, [charCounter, postButton]),
    ]),
  ]);

  // Event handlers
  composer.addEventListener("click", (e) => e.stopPropagation());
  background.append(composer);
  background.onclick = () => cleanup();

  // Handle escape key
  const escapeKeyHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      cleanup();
    }
  };
  document.addEventListener("keydown", escapeKeyHandler);

  // Final setup
  document.body.append(background);
  textboxes[0].focus();
};
