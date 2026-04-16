import { Terminal } from "@xterm/xterm";

export class VirtualKeyboard {
    container: HTMLElement;
    toggleButton: HTMLElement;
    isVisible: boolean = false;
    term: Terminal;
    encoder: TextEncoder;
    toServer: (data: string | Uint8Array) => void;

    private modifierState: { ctrl: boolean; shift: boolean; alt: boolean } = {
        ctrl: false,
        shift: false,
        alt: false,
    };

    constructor(term: Terminal, toServer: (data: string | Uint8Array) => void) {
        this.term = term;
        this.encoder = new TextEncoder();
        this.toServer = toServer;
        this.createToggleButton();
        this.createKeyboard();
    }

    private createToggleButton() {
        this.toggleButton = document.createElement("button");
        this.toggleButton.id = "vk-toggle";
        this.toggleButton.innerHTML = "⌨";
        this.toggleButton.title = "Toggle Virtual Keyboard";
        this.toggleButton.addEventListener("click", () => this.toggle());
        document.body.appendChild(this.toggleButton);
    }

    private createKeyboard() {
        this.container = document.createElement("div");
        this.container.id = "virtual-keyboard";
        this.container.className = "vk-hidden";

        // Number row
        const row1 = document.createElement("div");
        row1.className = "vk-row";
        [
            { label: "`", key: "`" }, { label: "1", key: "1" }, { label: "2", key: "2" },
            { label: "3", key: "3" }, { label: "4", key: "4" }, { label: "5", key: "5" },
            { label: "6", key: "6" }, { label: "7", key: "7" }, { label: "8", key: "8" },
            { label: "9", key: "9" }, { label: "0", key: "0" }, { label: "-", key: "-" },
            { label: "=", key: "=" },
        ].forEach(k => row1.appendChild(this.createKey(k.label, k.key, "normal")));
        this.container.appendChild(row1);

        // QWERTY row 1
        const row2 = document.createElement("div");
        row2.className = "vk-row";
        [
            { label: "Q", key: "q" }, { label: "W", key: "w" }, { label: "E", key: "e" },
            { label: "R", key: "r" }, { label: "T", key: "t" }, { label: "Y", key: "y" },
            { label: "U", key: "u" }, { label: "I", key: "i" }, { label: "O", key: "o" },
            { label: "P", key: "p" }, { label: "[", key: "[" }, { label: "]", key: "]" },
            { label: "\\", key: "\\" },
        ].forEach(k => row2.appendChild(this.createKey(k.label, k.key, "normal")));
        this.container.appendChild(row2);

        // QWERTY row 2
        const row3 = document.createElement("div");
        row3.className = "vk-row";
        [
            { label: "A", key: "a" }, { label: "S", key: "s" }, { label: "D", key: "d" },
            { label: "F", key: "f" }, { label: "G", key: "g" }, { label: "H", key: "h" },
            { label: "J", key: "j" }, { label: "K", key: "k" }, { label: "L", key: "l" },
            { label: ";", key: ";" }, { label: "'", key: "'" },
        ].forEach(k => row3.appendChild(this.createKey(k.label, k.key, "normal")));
        this.container.appendChild(row3);

        // QWERTY row 3
        const row4 = document.createElement("div");
        row4.className = "vk-row";
        [
            { label: "Z", key: "z" }, { label: "X", key: "x" }, { label: "C", key: "c" },
            { label: "V", key: "v" }, { label: "B", key: "b" }, { label: "N", key: "n" },
            { label: "M", key: "m" }, { label: ",", key: "," }, { label: ".", key: "." },
            { label: "/", key: "/" },
        ].forEach(k => row4.appendChild(this.createKey(k.label, k.key, "normal")));
        this.container.appendChild(row4);

        // Control row
        const row5 = document.createElement("div");
        row5.className = "vk-row";

        // Ctrl
        const ctrlKey = this.createKey("Ctrl", "\u001e", "modifier");
        ctrlKey.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleModifier("ctrl", ctrlKey);
        });
        row5.appendChild(ctrlKey);

        // Shift
        const shiftKey = this.createKey("Shift", "\u001f", "modifier");
        shiftKey.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleModifier("shift", shiftKey);
        });
        row5.appendChild(shiftKey);

        // Alt
        const altKey = this.createKey("Alt", "\u001b", "modifier");
        altKey.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleModifier("alt", altKey);
        });
        row5.appendChild(altKey);

        // Space
        const spaceKey = this.createKey("Space", " ", "space");
        row5.appendChild(spaceKey);

        // Function keys
        row5.appendChild(this.createKey("Tab", "\t", "action"));
        row5.appendChild(this.createKey("Enter", "\r", "action"));
        row5.appendChild(this.createKey("Esc", "\u001b", "action"));
        row5.appendChild(this.createKey("Del", "\u007f", "action"));

        this.container.appendChild(row5);

        // Directional row
        const row6 = document.createElement("div");
        row6.className = "vk-row vk-directional";
        [
            { label: "Home", key: "\u001b[H" },
            { label: "↑", key: "\u001b[A" },
            { label: "PgUp", key: "\u001b[5~" },
            { label: "←", key: "\u001b[D" },
            { label: "↓", key: "\u001b[B" },
            { label: "→", key: "\u001b[C" },
            { label: "End", key: "\u001b[F" },
            { label: "PgDn", key: "\u001b[6~" },
        ].forEach(k => row6.appendChild(this.createKey(k.label, k.key, "directional")));
        this.container.appendChild(row6);

        document.body.appendChild(this.container);
    }

    private createKey(label: string, key: string, type: string): HTMLElement {
        const btn = document.createElement("button");
        btn.className = `vk-key vk-key-${type}`;
        btn.textContent = label;
        btn.dataset.key = key;

        if (type !== "modifier") {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.sendKey(key);
            });
        }

        return btn;
    }

    private toggleModifier(modifier: string, btn: HTMLElement) {
        this.modifierState[modifier as keyof typeof this.modifierState] = !this.modifierState[modifier as keyof typeof this.modifierState];
        btn.classList.toggle("vk-active", this.modifierState[modifier as keyof typeof this.modifierState]);
    }

    private sendKey(key: string) {
        let fullKey = key;

        if (this.modifierState.ctrl) {
            if (key.length === 1 && key >= "a" && key <= "z") {
                fullKey = String.fromCharCode(key.charCodeAt(0) - 96);
            } else if (key === "Enter") {
                fullKey = "\u000d";
            } else if (key === "Tab") {
                fullKey = "\t";
            } else if (key === "Escape" || key === "\u001b") {
                fullKey = "\u001b";
            } else if (key === " ") {
                fullKey = "\u0000";
            }
        }

        if (this.modifierState.shift) {
            if (key.length === 1 && key >= "a" && key <= "z") {
                fullKey = key.toUpperCase();
            } else if (key === "`") fullKey = "~";
            else if (key === "1") fullKey = "!";
            else if (key === "2") fullKey = "@";
            else if (key === "3") fullKey = "#";
            else if (key === "4") fullKey = "$";
            else if (key === "5") fullKey = "%";
            else if (key === "6") fullKey = "^";
            else if (key === "7") fullKey = "&";
            else if (key === "8") fullKey = "*";
            else if (key === "9") fullKey = "(";
            else if (key === "0") fullKey = ")";
            else if (key === "-") fullKey = "_";
            else if (key === "=") fullKey = "+";
            else if (key === "[") fullKey = "{";
            else if (key === "]") fullKey = "}";
            else if (key === "\\") fullKey = "|";
            else if (key === ";") fullKey = ":";
            else if (key === "'") fullKey = '"';
            else if (key === ",") fullKey = "<";
            else if (key === ".") fullKey = ">";
            else if (key === "/") fullKey = "?";
            else if (key === "\u001b[A") fullKey = "\u001b[a";
            else if (key === "\u001b[B") fullKey = "\u001b[b";
            else if (key === "\u001b[C") fullKey = "\u001b[c";
            else if (key === "\u001b[D") fullKey = "\u001b[d";
        }

        if (this.modifierState.alt) {
            fullKey = "\u001b" + key;
        }

        this.toServer(this.encoder.encode(fullKey));
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.container.classList.toggle("vk-hidden", !this.isVisible);
        this.toggleButton.classList.toggle("vk-btn-active", this.isVisible);
    }

    destroy() {
        if (this.toggleButton && this.toggleButton.parentNode) {
            this.toggleButton.parentNode.removeChild(this.toggleButton);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}