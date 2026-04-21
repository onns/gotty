import { GoTTYXterm } from "./xterm";

export class VirtualKeyboard {
    container: HTMLElement;
    toolbar: HTMLElement;
    goTerm: GoTTYXterm;
    isVisible: boolean = false;
    encoder: TextEncoder;

    private modifierState: { ctrl: boolean; shift: boolean; alt: boolean } = {
        ctrl: false,
        shift: false,
        alt: false,
    };

    private static MIN_FONT_SIZE = 8;
    private static MAX_FONT_SIZE = 32;
    private static FONT_STEP = 2;

    constructor(goTerm: GoTTYXterm) {
        this.goTerm = goTerm;
        this.encoder = new TextEncoder();
        this.createToolbar();
        this.createKeyboard();
    }

    private createToolbar() {
        this.toolbar = document.createElement("div");
        this.toolbar.id = "vk-toolbar";

        const zoomOut = document.createElement("button");
        zoomOut.className = "vk-toolbar-btn";
        zoomOut.innerHTML = "−";
        zoomOut.title = "Zoom Out";
        zoomOut.addEventListener("click", () => this.zoom(-1));

        const zoomIn = document.createElement("button");
        zoomIn.className = "vk-toolbar-btn";
        zoomIn.innerHTML = "+";
        zoomIn.title = "Zoom In";
        zoomIn.addEventListener("click", () => this.zoom(1));

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "vk-toolbar-btn vk-toolbar-toggle";
        toggleBtn.innerHTML = "⌨";
        toggleBtn.title = "Toggle Virtual Keyboard";
        toggleBtn.addEventListener("click", () => this.toggle());

        this.toolbar.appendChild(zoomOut);
        this.toolbar.appendChild(zoomIn);
        this.toolbar.appendChild(toggleBtn);
        document.body.appendChild(this.toolbar);
    }

    private zoom(direction: number) {
        const current = this.goTerm.getFontSize();
        const next = current + direction * VirtualKeyboard.FONT_STEP;
        if (next < VirtualKeyboard.MIN_FONT_SIZE || next > VirtualKeyboard.MAX_FONT_SIZE) return;
        this.goTerm.setFontSize(next);
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

        // Modifier + Space row
        const row5 = document.createElement("div");
        row5.className = "vk-row";
        row5.appendChild(this.createKey("Ctrl", "ctrl", "modifier"));
        row5.appendChild(this.createKey("Shift", "shift", "modifier"));
        row5.appendChild(this.createKey("Alt", "alt", "modifier"));
        row5.appendChild(this.createKey("Space", " ", "space"));
        row5.appendChild(this.createKey("Tab", "\t", "action"));
        row5.appendChild(this.createKey("Enter", "\r", "action"));
        row5.appendChild(this.createKey("Esc", "\u001b", "action"));
        row5.appendChild(this.createKey("Del", "\u007f", "action"));
        this.container.appendChild(row5);

        // Directional row
        const row6 = document.createElement("div");
        row6.className = "vk-row";
        row6.appendChild(this.createKey("Home", "\u001b[H", "directional"));
        row6.appendChild(this.createKey("←", "\u001b[D", "directional"));
        row6.appendChild(this.createKey("↑", "\u001b[A", "directional"));
        row6.appendChild(this.createKey("↓", "\u001b[B", "directional"));
        row6.appendChild(this.createKey("→", "\u001b[C", "directional"));
        row6.appendChild(this.createKey("End", "\u001b[F", "directional"));
        row6.appendChild(this.createKey("PgUp", "\u001b[5~", "directional"));
        row6.appendChild(this.createKey("PgDn", "\u001b[6~", "directional"));
        this.container.appendChild(row6);

        document.body.appendChild(this.container);
    }

    private createKey(label: string, key: string, type: string): HTMLElement {
        const btn = document.createElement("button");
        btn.className = `vk-key vk-key-${type}`;
        btn.textContent = label;
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            this.handleKey(key, btn);
        });
        return btn;
    }

    private handleKey(key: string, btn: HTMLElement) {
        // Handle modifier toggles
        if (key === "ctrl" || key === "shift" || key === "alt") {
            this.modifierState[key] = !this.modifierState[key];
            btn.classList.toggle("vk-active", this.modifierState[key]);
            return;
        }

        let fullKey = key;

        if (this.modifierState.ctrl) {
            if (key.length === 1 && key >= "a" && key <= "z") {
                fullKey = String.fromCharCode(key.charCodeAt(0) - 96);
            }
            this.modifierState.ctrl = false;
            this.updateModifierButtons();
        }

        if (this.modifierState.shift) {
            if (key.length === 1 && key >= "a" && key <= "z") {
                fullKey = key.toUpperCase();
            }
            else if (key === "`") fullKey = "~";
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
            this.modifierState.shift = false;
            this.updateModifierButtons();
        }

        if (this.modifierState.alt) {
            fullKey = "\u001b" + key;
            this.modifierState.alt = false;
            this.updateModifierButtons();
        }

        this.goTerm.toServer(this.encoder.encode(fullKey));
    }

    private updateModifierButtons() {
        this.container.querySelectorAll(".vk-key-modifier").forEach((btn) => {
            const label = btn.textContent?.toLowerCase() || "";
            if (label === "ctrl") btn.classList.toggle("vk-active", this.modifierState.ctrl);
            if (label === "shift") btn.classList.toggle("vk-active", this.modifierState.shift);
            if (label === "alt") btn.classList.toggle("vk-active", this.modifierState.alt);
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.container.classList.toggle("vk-hidden", !this.isVisible);

        // Update toggle button active state
        const toggleBtn = this.toolbar.querySelector(".vk-toolbar-toggle");
        if (toggleBtn) toggleBtn.classList.toggle("vk-btn-active", this.isVisible);

        const termElem = this.goTerm.elem;
        if (this.isVisible) {
            // Wait for the keyboard to render, then adjust terminal height and toolbar position
            requestAnimationFrame(() => {
                const kbHeight = this.container.offsetHeight;
                termElem.style.height = `calc(100% - ${kbHeight}px)`;
                this.toolbar.style.bottom = `${kbHeight + 10}px`;
                // Wait for CSS transition to finish before fitting
                termElem.addEventListener("transitionend", () => this.goTerm.fit(), { once: true });
            });
        } else {
            termElem.style.height = "100%";
            this.toolbar.style.bottom = "20px";
            // Wait for CSS transition to finish before fitting
            termElem.addEventListener("transitionend", () => this.goTerm.fit(), { once: true });
        }
    }

    destroy() {
        if (this.toolbar && this.toolbar.parentNode) {
            this.toolbar.parentNode.removeChild(this.toolbar);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
