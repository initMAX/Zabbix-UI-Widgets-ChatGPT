<?php declare(strict_types = 0);
/*
** initMAX
** Copyright (C) 2021-2022 initMAX s.r.o.
**
** This program is free software; you can redistribute it and/or modify
** it under the terms of the GNU General Public License as published by
** the Free Software Foundation; either version 3 of the License, or
** (at your option) any later version.
**
** This program is distributed in the hope that it will be useful,
** but WITHOUT ANY WARRANTY; without even the implied warranty of
** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
** GNU General Public License for more details.
**
** You should have received a copy of the GNU General Public License
** along with this program; if not, write to the Free Software
** Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
**/

?>//<script>

window.widget_openai_form = new class {

    #form = undefined;

    init() {
        this.#form = document.getElementById('widget-dialogue-form');
        this.#form.querySelector('[name="service"]')?.addEventListener('change', this.setEndpoint.bind(this));

        this.addLogo();
    }

    addLogo() {
        const el = document.createElement('div');
        el.classList.add('initmax-free');

        this.#form.insertBefore(el, this.#form.firstChild);
    }

    setEndpoint(e) {
        const value = e.target.value;

        const endpoint = this.#form.querySelector('[name="endpoint"]');

        switch(value) {
            case '0':
                endpoint.value = 'https://api.openai.com/v1/chat/completions';
                break;
            case '1':
                endpoint.value = 'https://gpt.initmax.cz/v1/chat/completions';
                break;
            default:
                endpoint.value = '';
        }
    }
};
