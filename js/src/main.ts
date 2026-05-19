import { ConnectionFactory } from "./websocket";
import { WebTTY, protocols } from "./webtty";
import { GoTTYXterm } from "./xterm";
import { initThemePicker } from "./theme-picker";
import { VirtualKeyboard } from "./VirtualKeyboard";

// @TODO remove these
declare var gotty_auth_token: string;
declare var gotty_term: string;
declare var gotty_ws_query_args: string;
declare var gotty_preferences: Record<string, unknown>;

const elem = document.getElementById("terminal")

if (elem !== null) {
    var term: GoTTYXterm;
    term = new GoTTYXterm(elem, gotty_preferences);

    const httpsEnabled = window.location.protocol == "https:";
    const queryArgs = (gotty_ws_query_args === "") ? "" : "?" + gotty_ws_query_args;
    const url = (httpsEnabled ? 'wss://' : 'ws://') + window.location.host + window.location.pathname + 'ws' + queryArgs;
    const args = window.location.search;
    const factory = new ConnectionFactory(url, protocols);
    const wt = new WebTTY(term, factory, args, gotty_auth_token);
    const closer = wt.open();

    // Initialize virtual keyboard and theme picker together
    const vk = new VirtualKeyboard(term);
    initThemePicker(term.term, () => vk.toggle());

    // According to https://developer.mozilla.org/en-US/docs/Web/API/Window/unload_event
    // this event is unreliable and in some cases (Firefox is mentioned), having an
    // "unload" event handler can have unwanted side effects. Consider commenting it out.
    window.addEventListener("unload", () => {
        closer();
        term.close();
    });
};
