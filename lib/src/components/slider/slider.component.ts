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

type FIELD_TYPE = number;

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
    /** Minimum value of the slider */
    @Input() public min = 0;
    /** Maximum value of the slider */
    @Input() public max = 100;
    /** Small change value for the slider */
    @Input() public step = 1;
    /** Options for the slider */
    @Input() public options: ISliderOptions;

    /** Current value of the slider */
    public value: FIELD_TYPE;

    /** Form control on change handler */
    private _onChange: (_: FIELD_TYPE) => void;
    /** Form control on touch handler */
    private _onTouch: (_: FIELD_TYPE) => void;

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
        this.value = Math.round(position * range) * this.step + this.min;
        this.checkBounds();
        if (this._onChange) {
            this._onChange(this.value);
        }
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
        if (!this.value) {
            this.value = this.min;
        }
        this.value += event.deltaY < 0 ? this.step || 1 : -this.step || -1;
        this.checkBounds();
        if (this._onChange) {
            this._onChange(this.value);
        }
    }

    /**
     * Check that the slider value is within the set bound
     */
    private checkBounds() {
        if (this.min > this.max) {
            this.min = this.max - this.step;
        }
        if (this.value < this.min) {
            this.value = this.min;
        } else if (this.value > this.max) {
            this.value = this.max;
        }
    }

    /**
     * Update local value when form control value is changed
     * @param value The new value for the component
     */
    public writeValue(value: FIELD_TYPE) {
        this.value = value;
    }

    /**
     * Registers a callback function that is called when the control's value changes in the UI.
     * @param fn The callback function to register
     */
    public registerOnChange(fn: (_: FIELD_TYPE) => void): void {
        this._onChange = fn;
    }

    /**
     * Registers a callback function is called by the forms API on initialization to update the form model on blur.
     * @param fn The callback function to register
     */
    public registerOnTouched(fn: (_: FIELD_TYPE) => void): void {
        this._onTouch = fn;
    }
}
