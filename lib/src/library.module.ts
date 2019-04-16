/**
 * @Author: Alex Sorafumo
 * @Date:   09/12/2016 9:39 AM
 * @Email:  alex@yuion.net
 * @Filename: index.ts
 * @Last modified by:   Alex Sorafumo
 * @Last modified time: 06/02/2017 11:28 AM
 */

import { CommonModule } from '@angular/common';
import { NgModule, Type } from '@angular/core';
import { CustomEventsModule } from '@acaprojects/ngx-custom-events';

import { LIBRARY_SETTINGS } from './settings';
import { SliderComponent } from './components/slider/slider.component';

import * as day_api from 'dayjs';
const dayjs = day_api;

const COMPONENTS: Type<any>[] = [SliderComponent];

@NgModule({
    declarations: [...COMPONENTS],
    imports: [CommonModule, CustomEventsModule],
    exports: [...COMPONENTS]
})
class LibraryModule {
    public static version = '0.1.1';
    private static init = false;
    private build = dayjs(1555417560000);

    constructor() {
        if (!LibraryModule.init) {
            const now = dayjs();
            LibraryModule.init = true;
            const build = now.isSame(this.build, 'd')
                ? `Today at ${this.build.format('h:mmA')}`
                : this.build.format('D MMM YYYY, h:mmA');
            LIBRARY_SETTINGS.version(LibraryModule.version, build);
        }
    }
}

export { LibraryModule as ASliderModule };
export { LibraryModule as ACA_SLIDER_MODULE };
