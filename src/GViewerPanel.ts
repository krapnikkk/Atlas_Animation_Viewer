export default class GViewerPanel extends fgui.GComponent {
    constructor() {
        super();
    }

    g_tips: fgui.GComponent;
    protected onConstruct(): void {
        super.onConstruct();
        this.init();
    }

    init() {
        this.g_tips = this.getChild("g_tips") as fgui.GComponent;
    }

    onShowAnimations() {
        this.g_tips.visible = false;
    }
}