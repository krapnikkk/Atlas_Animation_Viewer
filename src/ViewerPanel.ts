export default class ViewerPanel extends fgui.GComponent {
    constructor() {
        super();
    }

    gc_tips: fgui.GComponent;
    protected onConstruct(): void {
        super.onConstruct();
        this.init();
    }

    init() {
        this.gc_tips = this.getChild("gc_tips") as fgui.GComponent;
    }

    onShow() {
        this.gc_tips.visible = false;
    }
}