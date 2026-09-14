import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


/* ---------------- Firebase ---------------- */

const firebaseConfig = {
  apiKey: "AIzaSyDE8Mraj8_lnhbDgffb9S51mt5rb8FSzV4",
  authDomain: "caesar-e3fc3.firebaseapp.com",
  projectId: "caesar-e3fc3",
  storageBucket: "caesar-e3fc3.firebasestorage.app",
  messagingSenderId: "978699090575",
  appId: "1:978699090575:web:9bb0be22beb1a75acb0efa",
  measurementId: "G-94YPJ8DX07"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* ---------------- UI ---------------- */

const form =
    document.getElementById("message-form");

const input =
    document.getElementById("message-input");

const chat =
    document.getElementById("chat");

const sendButton =
    document.getElementById("send-button");

const welcome =
    document.getElementById("welcome");

const messageMenu =
    document.getElementById("message-menu");

const replyPreview =
    document.getElementById("reply-preview");

const replyPreviewText =
    document.getElementById("reply-preview-text");

const cancelReply =
    document.getElementById("cancel-reply");


/* ---------------- State ---------------- */

let currentUser = null;

let selectedMessageId = null;

let replyTo = null;

let longPressTimer = null;

let touchStartX = 0;
let touchStartY = 0;

const hiddenMessagesKey =
    "caesar-hidden-messages";

let hiddenMessages =
    JSON.parse(
        localStorage.getItem(hiddenMessagesKey) || "[]"
    );


/* ---------------- Authentication ---------------- */

async function initializeUser() {

    try {

        const result =
            await signInAnonymously(auth);

        currentUser =
            result.user;

        console.log(
            "Caesar Firebase connected."
        );

        console.log(
            "Anonymous user ID:",
            currentUser.uid
        );

        await loadMessages();

        input.focus();

    } catch (error) {

        console.error(
            "Firebase authentication failed:",
            error
        );
    }
}


/* ---------------- Firestore ---------------- */

function getMessagesRef() {

    return collection(
        db,
        "users",
        currentUser.uid,
        "messages"
    );
}


function getMessageRef(messageId) {

    return doc(
        db,
        "users",
        currentUser.uid,
        "messages",
        messageId
    );
}


async function saveMessage(
    text,
    type,
    replyData = null
) {

    try {

        const data = {
            text,
            type,
            createdAt: serverTimestamp(),
            reaction: null
        };

        if (replyData) {

            data.replyTo = {
                id: replyData.id,
                text: replyData.text
            };
        }

        const result =
            await addDoc(
                getMessagesRef(),
                data
            );

        console.log(
            "Message saved:",
            result.id
        );

    } catch (error) {

        console.error(
            "Failed to save message:",
            error
        );
    }
}


async function loadMessages() {

    try {

        const messagesQuery =
            query(
                getMessagesRef(),
                orderBy(
                    "createdAt",
                    "asc"
                )
            );

        const snapshot =
            await getDocs(
                messagesQuery
            );

        if (snapshot.empty) {

            console.log(
                "No previous messages found."
            );

            return;
        }

        if (welcome) {
            welcome.remove();
        }

        snapshot.forEach(
            (messageDoc) => {

                if (
                    hiddenMessages.includes(
                        messageDoc.id
                    )
                ) {
                    return;
                }

                addMessage(
                    messageDoc.id,
                    messageDoc.data()
                );
            }
        );

        console.log(
            `Loaded ${snapshot.size} messages.`
        );

    } catch (error) {

        console.error(
            "Failed to load messages:",
            error
        );
    }
}


/* ---------------- Message UI ---------------- */

function addMessage(id, data) {

    const message =
        document.createElement("div");

    message.classList.add(
        "message",
        `${data.type}-message`
    );

    message.dataset.messageId =
        id;


    /* Reply */

    if (data.replyTo) {

        const reply =
            document.createElement("div");

        reply.className =
            "message-reply";

        const label =
            document.createElement("span");

        label.className =
            "message-reply-label";

        label.textContent =
            "Reply";

        const text =
            document.createElement("span");

        text.textContent =
            data.replyTo.text;

        reply.appendChild(label);
        reply.appendChild(text);

        message.appendChild(reply);
    }


    /* Text */

    const messageText =
        document.createElement("div");

    messageText.className =
        "message-text";

    messageText.textContent =
        data.text;

    message.appendChild(
        messageText
    );


    /* Reaction */

    if (data.reaction) {

        const reaction =
            document.createElement("div");

        reaction.className =
            "message-reaction";

        reaction.textContent =
            data.reaction;

        message.appendChild(
            reaction
        );
    }


    /* Desktop right-click */

    message.addEventListener(
        "contextmenu",
        function (event) {

            event.preventDefault();

            openMessageMenu(
                id,
                event.clientX,
                event.clientY
            );
        }
    );


    /* Mobile long press */

    message.addEventListener(
        "touchstart",
        function (event) {

            if (
                event.touches.length !== 1
            ) {
                return;
            }

            touchStartX =
                event.touches[0].clientX;

            touchStartY =
                event.touches[0].clientY;

            longPressTimer =
                setTimeout(
                    () => {

                        openMessageMenu(
                            id,
                            touchStartX,
                            touchStartY
                        );

                    },
                    550
                );
        },
        {
            passive: true
        }
    );


    message.addEventListener(
        "touchmove",
        function (event) {

            if (
                !event.touches.length
            ) {
                return;
            }

            const x =
                event.touches[0].clientX;

            const y =
                event.touches[0].clientY;

            const deltaX =
                x - touchStartX;

            const deltaY =
                y - touchStartY;


            /*
             * Cancel long press when
             * moving vertically.
             */

            if (
                Math.abs(deltaY) > 12
            ) {

                clearTimeout(
                    longPressTimer
                );

                longPressTimer =
                    null;
            }


            /*
             * Swipe right = reply.
             */

            if (
                deltaX > 70 &&
                Math.abs(deltaX) >
                Math.abs(deltaY) * 1.5
            ) {

                clearTimeout(
                    longPressTimer
                );

                longPressTimer =
                    null;

                startReply(id);
            }

        },
        {
            passive: true
        }
    );


    message.addEventListener(
        "touchend",
        function () {

            clearTimeout(
                longPressTimer
            );

            longPressTimer =
                null;
        }
    );


    message.addEventListener(
        "touchcancel",
        function () {

            clearTimeout(
                longPressTimer
            );

            longPressTimer =
                null;
        }
    );


    chat.appendChild(
        message
    );

    chat.scrollTop =
        chat.scrollHeight;
}


/* ---------------- Context menu ---------------- */

function openMessageMenu(
    messageId,
    x,
    y
) {

    selectedMessageId =
        messageId;

    messageMenu.classList.add(
        "visible"
    );


    /*
     * The menu needs its dimensions
     * before we can position it.
     */

    const menuWidth =
        messageMenu.offsetWidth;

    const menuHeight =
        messageMenu.offsetHeight;


    let left =
        x;

    let top =
        y + 8;


    if (
        left + menuWidth >
        window.innerWidth - 8
    ) {

        left =
            window.innerWidth -
            menuWidth -
            8;
    }


    if (
        left < 8
    ) {

        left = 8;
    }


    if (
        top + menuHeight >
        window.innerHeight - 8
    ) {

        top =
            y -
            menuHeight -
            8;
    }


    if (
        top < 8
    ) {

        top = 8;
    }


    messageMenu.style.left =
        `${left}px`;

    messageMenu.style.top =
        `${top}px`;
}


function closeMessageMenu() {

    messageMenu.classList.remove(
        "visible"
    );

    selectedMessageId =
        null;
}


/* ---------------- Reply ---------------- */

function startReply(messageId) {

    const message =
        document.querySelector(
            `[data-message-id="${messageId}"]`
        );

    if (!message) {
        return;
    }


    const text =
        message.querySelector(
            ".message-text"
        )?.textContent || "";


    replyTo = {
        id: messageId,
        text
    };


    replyPreviewText.textContent =
        text;

    replyPreview.classList.add(
        "visible"
    );

    input.focus();
}


function cancelReplyMode() {

    replyTo = null;

    replyPreview.classList.remove(
        "visible"
    );

    replyPreviewText.textContent =
        "";
}


cancelReply.addEventListener(
    "click",
    cancelReplyMode
);


/* ---------------- React ---------------- */

async function reactToMessage(
    messageId
) {

    const reaction =
        window.prompt(
            "Enter an emoji"
        );

    if (!reaction) {
        return;
    }


    try {

        await updateDoc(
            getMessageRef(messageId),
            {
                reaction
            }
        );


        const message =
            document.querySelector(
                `[data-message-id="${messageId}"]`
            );

        if (!message) {
            return;
        }


        let reactionElement =
            message.querySelector(
                ".message-reaction"
            );


        if (!reactionElement) {

            reactionElement =
                document.createElement(
                    "div"
                );

            reactionElement.className =
                "message-reaction";

            message.appendChild(
                reactionElement
            );
        }


        reactionElement.textContent =
            reaction;

    } catch (error) {

        console.error(
            "Failed to react:",
            error
        );
    }
}


/* ---------------- Delete ---------------- */

function deleteForMe(messageId) {

    if (
        !hiddenMessages.includes(
            messageId
        )
    ) {

        hiddenMessages.push(
            messageId
        );

        localStorage.setItem(
            hiddenMessagesKey,
            JSON.stringify(
                hiddenMessages
            )
        );
    }


    const message =
        document.querySelector(
            `[data-message-id="${messageId}"]`
        );


    if (message) {
        message.remove();
    }
}


async function deleteForEveryone(
    messageId
) {

    try {

        await deleteDoc(
            getMessageRef(messageId)
        );


        const message =
            document.querySelector(
                `[data-message-id="${messageId}"]`
            );


        if (message) {
            message.remove();
        }

    } catch (error) {

        console.error(
            "Failed to delete message:",
            error
        );
    }
}


/* ---------------- Menu actions ---------------- */

messageMenu.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                "button"
            );

        if (!button) {
            return;
        }


        const action =
            button.dataset.action;

        const messageId =
            selectedMessageId;


        closeMessageMenu();


        if (!messageId) {
            return;
        }


        if (
            action === "reply"
        ) {

            startReply(
                messageId
            );
        }


        if (
            action === "react"
        ) {

            await reactToMessage(
                messageId
            );
        }


        if (
            action === "delete-me"
        ) {

            deleteForMe(
                messageId
            );
        }


        if (
            action === "delete-everyone"
        ) {

            await deleteForEveryone(
                messageId
            );
        }

    }
);


/* ---------------- Close menu ---------------- */

document.addEventListener(
    "click",
    function (event) {

        if (
            !messageMenu.contains(
                event.target
            )
        ) {

            closeMessageMenu();
        }
    }
);


document.addEventListener(
    "scroll",
    function () {

        closeMessageMenu();

    },
    true
);


/* ---------------- Composer ---------------- */

function updateSendButton() {

    sendButton.disabled =
        input.value.trim() === "";
}


form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const text =
            input.value.trim();


        if (!text) {
            return;
        }


        if (!currentUser) {

            console.error(
                "Firebase user is not ready yet."
            );

            return;
        }


        if (welcome) {
            welcome.remove();
        }


        /*
         * Save the reply BEFORE
         * clearing reply mode.
         */

        const currentReply =
            replyTo;


        /*
         * Show immediately.
         */

        addMessage(
            "temporary-" + Date.now(),
            {
                text,
                type: "user",
                replyTo: currentReply
            }
        );


        input.value = "";

        updateSendButton();

        cancelReplyMode();

        input.focus();


        /*
         * Persist to Firestore.
         */

        await saveMessage(
            text,
            "user",
            currentReply
        );

    }
);


/* ---------------- Input ---------------- */

input.addEventListener(
    "input",
    updateSendButton
);


/* ---------------- Start ---------------- */

updateSendButton();

initializeUser();