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

class CWidgetOpenAI extends CWidget {
    apiToken = this._fields.token;
    apiEndpoint = this._fields.endpoint;
    stream = true;
    abort = false;

    setContents(response) {
        super.setContents(response);

        this.sendButton = this._body.querySelector('[name=send-button]');
        this.stopButton = this._body.querySelector('[name=stop-button]');
        this.userInput = this._body.querySelector('.chat-form-message');
        this.chatLog = this._body.querySelector('.chat-log');

        this.userInput.addEventListener('keydown', e => {
            if (e.code == 'Enter' || e.code == 'NumpadEnter') {
                this.sendMessage();
            }
        });
        this.sendButton.addEventListener('click', this.sendMessage.bind(this));
        this.stopButton.addEventListener('click', this.stopStream.bind(this));      
    }

    async sendMessage() {
        const question = this.userInput.value;
        this.userInput.value = '';

        if (!question) {
            return;
        }

        this.hideSendButton();
        this.showStopButton();

        this.stopController = new AbortController();

        const questionElement = this.createMessage('user');
        questionElement.innerHTML = question;

        const answerElement = this.createMessage('bot');

        const request = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiToken}`
            },
            signal: this.stopController.signal,
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: question,
                    },
                ],
                stream: this.stream,
            })
        });

        if (this.stream) {
            await this.streamResponse(request, answerElement);
        }
        else {
            await this.response(request, answerElement);
        }

        this.showSendButton();
        this.hideStopButton();
    }

    stopStream() {
        if (this.stream) {
            this.stopController.abort();
        }

        this.showSendButton();
        this.hideStopButton();
    }

    async streamResponse(request, answerElement) {
        const reader = request.body?.pipeThrough(new TextDecoderStream()).getReader();
    
        let lastJsonLine = '';
        let rawAnswer = '';

        while (true) {
            const res = await reader?.read();
    
            if (res?.done) {
               return;
            }
    
            if (!res?.value) {
                continue;
            }
    
            const jsonChunks = res.value.split('\n\n').filter(line => line.trim().length > 0);
  
            for (const chunk of jsonChunks) {
                lastJsonLine += chunk;
                if (lastJsonLine.startsWith('data:')) {
                    lastJsonLine = lastJsonLine.slice('data:'.length);
                }
    
                try {
                    const answer = JSON.parse(lastJsonLine);
                    lastJsonLine = ''
    
                    if (answer.choices[0].delta.finish_reason !== 'stop') {
                        const reply = answer.choices[0].delta.content;
    
                        for (let e = 0, len = reply.length; e < len; e++) {

                            if (answerElement.querySelector('.dot-flashing')) {
                                answerElement.querySelector('.dot-flashing').remove();
                            }

                            rawAnswer += reply[e];

                            answerElement.innerHTML = marked.parse(rawAnswer);
                            this.chatLog.scrollTop = this.chatLog.scrollHeight;
                        }
                    }
                } catch (e) {}
            }
        }
    }

    async response(request, answerElement) {
        const response = await request.json();

        if (response.choices.length > 0) {
            answerElement.innerHTML = response.choices[0].message.content;
            this.chatLog.scrollTop = this.chatLog.scrollHeight;
        }
    }

    createMessage(sender) {
        if (!(sender === 'user' || sender === 'bot')) {
            return null;
        }

        const message = document.createElement('div');
        message.classList.add('chat-log-message', `chat-log-message-${sender}`);

        message.insertAdjacentHTML(
            'beforeend',
            `<div class="chat-log-message-author chat-log-message-author-${sender}"></div>
             <div class="chat-log-message-text chat-log-message-text-${sender}"><div class="dot-flashing"></div></div>`
        );

        this.chatLog.appendChild(message);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;

        return message.querySelector('.chat-log-message-text');
    }

    hideSendButton() {
        if (this.abort) this.sendButton.classList.add('chat-form-button--hidden');
    }

    showSendButton() {
        if (this.abort) this.sendButton.classList.remove('chat-form-button--hidden');
    }

    hideStopButton() {
        if (this.abort) this.stopButton.classList.add('chat-form-button-stop--hidden');
    }

    showStopButton() {
        if (this.abort) this.stopButton.classList.remove('chat-form-button-stop--hidden');
    }

    hasPadding () {
        return false;
    }
}
