let savedValues

window.currentUser={ id:"admin",rights:{level:"SU",map:"EDIT",tables:{}},metadata:{}}


// Save a cookie
function setCookie(name, value, days) {
    let expires = "";

    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }

    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
}

// Load a cookie
function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(";");

    for (let cookie of cookies) {
        while (cookie.charAt(0) === " ") {
            cookie = cookie.substring(1);
        }

        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }

    return null;
}

// Delete a cookie
function deleteCookie(name) {
    document.cookie = name + "=; Max-Age=-1; path=/";
}

/*
// Save
setCookie("username", "Alice", 7);

// Load
const user = getCookie("username");
console.log(user);

// Delete
deleteCookie("username");
*/
////////////////////////   CLASS ////////////////////////////////////////////////
class CookieStore {
    static set(name, value, options = {}) {
        const {
            days = 7,
            path = "/",
            secure = true,
            sameSite = "Lax"
        } = options;

        const expires = new Date(
            Date.now() + days * 864e5
        ).toUTCString();

        // Convert objects to JSON
        const serialized =
            typeof value === "object"
                ? JSON.stringify(value)
                : String(value);

        document.cookie = [
            `${encodeURIComponent(name)}=${encodeURIComponent(serialized)}`,
            `expires=${expires}`,
            `path=${path}`,
            `SameSite=${sameSite}`,
            secure ? "Secure" : ""
        ]
        .filter(Boolean)
        .join("; ");
    }

    static get(name) {
        const key = `${encodeURIComponent(name)}=`;

        const cookie = document.cookie
            .split("; ")
            .find(row => row.startsWith(key));

        if (!cookie) return null;

        const value = decodeURIComponent(
            cookie.substring(key.length)
        );

        // Try parsing JSON
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    static delete(name, path = "/") {
        document.cookie = [
            `${encodeURIComponent(name)}=`,
            "Max-Age=0",
            `path=${path}`
        ].join("; ");
    }
}

/*
CookieStore.set("user", {
    id: 42,
    name: "Alice",
    darkMode: true,
    tags: ["admin", "editor"]
});

// Retrieve object
const user = CookieStore.get("user");

console.log(user.name);      // Alice
console.log(user.darkMode);  // true
console.log(user.tags);      // ["admin", "editor"]

*/

