import {
    Component,
    OnInit,
    forwardRef,
    Output,
    Input,
    EventEmitter,
    Renderer2,
    ViewChild,
    ElementRef,
    SimpleChanges,
    OnChanges
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface ISliderOptions {
    /** Whether slider is display vertically */
    vertical: boolean;
}

@Component({
    selector: 'a-slider',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SliderComponent),
            multi: true
        }
    ]
})
export class SliderComponent implements OnChanges, ControlValueAccessor {
    /** ID of the slider element */
    @Input() public id: string;
    /** CSS class to add to the root element of the component */
    @Input() public klass = 'default';
    /** State of the slider */
    @Input() public model = 0;
    /** Minimum value of the slider */
    @Input() public min = 0;
    /** Maximum value of the slider */
    @Input() public max = 100;
    /** Small change value for the slider */
    @Input() public step = 1;
    /** Options for the slider */
    @Input() public options: ISliderOptions;
    /** Change emitter for the date timestamp */
    @Output() public modelChange = new EventEmitter<number>();

    /** Form control on change handler */
    public onChange: (_: number) => void;
    /** Form control on touch handler */
    public onTouch: (_: number) => void;

    private wheel_listener: () => void;
    private drag_listener: () => void;
    private release_listener: () => void;

    private cached_box: ClientRect;

    @ViewChild('bar') public bar: ElementRef<HTMLDivElement>;

    constructor(private renderer: Renderer2) {}

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.max || changes.min || changes.model) {
            this.checkBounds();
        }
    }

    /**
     * Handle element being focused
     */
    public focus() {
        this.wheel_listener = this.renderer.listen('window', 'wheel', e => this.handleWheel(e));
    }

    /**
     * Handle focus being lost
     */
    public blur() {
        if (this.wheel_listener) {
            this.wheel_listener();
            this.wheel_listener = null;
        }
    }

    public update(event: MouseEvent | TouchEvent) {
        event.preventDefault();
        const center = {
            x: event instanceof MouseEvent ? event.clientX : event.touches[0].clientX,
            y: event instanceof MouseEvent ? event.clientY : event.touches[0].clientY
        };
        const box = this.cached_box || this.bar.nativeElement.getBoundingClientRect();
        const position =
            this.options && this.options.vertical
                ? 1 - (center.y - box.top) / box.height
                : (center.x - box.left) / box.width;
        const range = (this.max - this.min) / this.step;
        this.model = Math.round(position * range) * this.step + this.min;
        this.checkBounds();
        this.modelChange.emit(this.model);
    }

    /**
     * Handle panning on the slider
     * @param event
     */
    public handleDrag(event: MouseEvent | TouchEvent) {
        this.cached_box = this.bar.nativeElement.getBoundingClientRect();
        if (event instanceof MouseEvent) {
            this.drag_listener = this.renderer.listen('window', 'mousemove', e => this.update(e));
            this.release_listener = this.renderer.listen('window', 'mouseup', e => this.handleRelease(e));
        } else {
            this.drag_listener = this.renderer.listen('window', 'touchmove', e => this.update(e));
            this.release_listener = this.renderer.listen('window', 'touchrelease', e => this.handleRelease(e));
        }
    }

    private handleRelease(e) {
        this.cached_box = null;
        if (this.drag_listener) {
            this.drag_listener();
            this.drag_listener = null;
        }
        if (this.release_listener) {
            this.release_listener();
            this.release_listener = null;
        }
    }

    /**
     * Update slider value based off mouse wheel events
     * @param event
     */
    private handleWheel(event: WheelEvent) {
        event.preventDefault();
        if (!this.model) {
            this.model = this.min;
        }
        this.model += event.deltaY < 0 ? this.step || 1 : -this.step || -1;
        this.checkBounds();
        this.modelChange.emit(this.model);
    }

    /**
     * Check that the slider value is within the set bound
     */
    private checkBounds() {
        if (this.min > this.max) {
            this.min = this.max - this.step;
        }
        if (this.model < this.min) {
            this.model = this.min;
        } else if (this.model > this.max) {
            this.model = this.max;
        }
    }

    /**
     * Update local value when form control value is changed
     * @param value
     */
    public writeValue(value: number) {
        this.model = value;
        this.modelChange.emit(this.model);
    }

    /**
     * Register on change callback given for form control
     * @param fn
     */
    public registerOnChange(fn: (_: number) => void): void {
        this.onChange = fn;
    }

    /**
     * Register on touched callback given for form control
     * @param fn
     */
    public registerOnTouched(fn: (_: number) => void): void {
        this.onTouch = fn;
    }
}
