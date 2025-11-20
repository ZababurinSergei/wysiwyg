export async function createActions(context) {
    return {
        getContent: getContent.bind(context),
        setContent: setContent.bind(context),
        clearContent: clearContent.bind(context),
        insertText: insertText.bind(context),
        insertHTML: insertHTML.bind(context),
        insertImage: insertImage.bind(context),
        insertLink: insertLink.bind(context),
        toggleFormat: toggleFormat.bind(context),
        getFormats: getFormats.bind(context),
        exportContent: exportContent.bind(context),
        toggleTheme: toggleTheme.bind(context),
        focus: focus.bind(context),
        blur: blur.bind(context),
        enable: enable.bind(context),
        disable: disable.bind(context),
        getStats: getStats.bind(context),
        insertTable: insertTable.bind(context),
        addEmbed: addEmbed.bind(context),
        _updatePlaceholderState: _updatePlaceholderState.bind(context)
    };
}

async function getContent(format = 'html') {
    if (!this.quill) return '';

    switch (format) {
        case 'html':
            return this.quill.root.innerHTML;
        case 'text':
            return this.quill.getText();
        case 'delta':
            return this.quill.getContents();
        case 'formatted-text':
            return this.quill.getSemanticHTML();
        default:
            return this.quill.root.innerHTML;
    }
}

async function setContent(content, format = 'html') {
    if (!this.quill) return;

    const selection = this.quill.getSelection();
    const wasEmpty = this.quill.getText().trim() === '';

    try {
        switch (format) {
            case 'html':
                this.quill.root.innerHTML = content;
                break;
            case 'text':
                this.quill.setText(content);
                break;
            case 'delta':
                this.quill.setContents(content);
                break;
            default:
                this.quill.root.innerHTML = content;
        }

        // Обновляем состояние placeholder
        this._updatePlaceholderState();

        // Восстанавливаем выделение если было
        if (selection && !wasEmpty) {
            setTimeout(() => {
                try {
                    this.quill.setSelection(selection);
                } catch (error) {
                    console.warn('Не удалось восстановить выделение после установки контента:', error);
                }
            }, 10);
        }

        // Обновляем статистику
        this._handleTextChange();

        this.postMessage({
            type: 'content-set',
            format: format,
            contentLength: content.length
        });
    } catch (error) {
        console.error('Ошибка установки контента:', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'setContent',
            message: 'Ошибка установки содержимого редактора',
            details: error
        });
    }
}

async function clearContent() {
    if (!this.quill) return;

    try {
        const length = this.quill.getLength();
        this.quill.deleteText(0, length);

        // Обновляем состояние placeholder
        this._updatePlaceholderState();

        this.postMessage({
            type: 'content-cleared'
        });
    } catch (error) {
        console.error('Ошибка очистки редактора:', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'clearContent',
            message: 'Ошибка очистки редактора',
            details: error
        });
    }
}

async function insertText(text, formats = {}) {
    if (!this.quill) return;

    try {
        const selection = this.quill.getSelection();
        if (selection) {
            this.quill.insertText(selection.index, text, formats);
            this.quill.setSelection(selection.index + text.length, 0);
        } else {
            // Если нет выделения, вставляем в конец
            const length = this.quill.getLength();
            this.quill.insertText(length - 1, text, formats);
            this.quill.setSelection(length - 1 + text.length, 0);
        }

        // Обновляем состояние placeholder
        this._updatePlaceholderState();

        this.postMessage({
            type: 'text-inserted',
            text: text,
            formats: formats
        });
    } catch (error) {
        console.error('Ошибка вставки текста:', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'insertText',
            message: 'Ошибка вставки текста',
            details: error
        });
    }
}

async function insertHTML(html) {
    if (!this.quill) return;

    try {
        const selection = this.quill.getSelection();
        if (selection) {
            const range = selection.index;
            this.quill.clipboard.dangerouslyPasteHTML(range, html);

            // Обновляем состояние placeholder
            this._updatePlaceholderState();

            this.postMessage({
                type: 'html-inserted',
                html: html
            });
        }
    } catch (error) {
        console.error('Ошибка вставки HTML:', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'insertHTML',
            message: 'Ошибка вставки HTML',
            details: error
        });
    }
}

async function insertImage(url, alt = '') {
    if (!this.quill) return;

    try {
        const selection = this.quill.getSelection();
        if (selection) {
            this.quill.insertEmbed(selection.index, 'image', {
                url: url,
                alt: alt
            });

            // Обновляем состояние placeholder
            this._updatePlaceholderState();

            this.postMessage({
                type: 'image-inserted',
                url: url,
                alt: alt
            });
        }
    } catch (error) {
        console.error('Ошибка вставки изображения:', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'insertImage',
            message: 'Ошибка вставки изображения',
            details: error
        });
    }
}

async function insertLink() {
    if (!this.quill) return;

    try {
        const selection = this.quill.getSelection();
        if (!selection) {
            await this.showModal({
                title: 'Внимание',
                content: 'Пожалуйста, выделите текст для создания ссылки',
                buttons: [{ text: 'OK', type: 'primary' }]
            });
            return;
        }

        const selectedText = this.quill.getText(selection.index, selection.length);

        const result = await this.showModal({
            title: 'Вставка ссылки',
            content: `
        <div class="link-dialog">
          <div class="form-group">
            <label for="link-url">URL ссылки:</label>
            <input type="url" id="link-url" placeholder="https://example.com" class="link-input" required>
          </div>
          <div class="form-group">
            <label for="link-text">Текст ссылки:</label>
            <input type="text" id="link-text" value="${selectedText}" class="link-input" placeholder="Текст ссылки">
          </div>
          <div class="form-group">
            <label for="link-title">Заголовок (title):</label>
            <input type="text" id="link-title" class="link-input" placeholder="Всплывающая подсказка">
          </div>
        </div>
      `,
            buttons: [
                {
                    text: 'Вставить',
                    type: 'primary',
                    action: () => this._insertLinkHandler()
                },
                {
                    text: 'Отмена',
                    type: 'secondary'
                }
            ]
        });

    } catch (error) {
        console.error('Ошибка вставки ссылки:', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'insertLink',
            message: 'Ошибка вставки ссылки',
            details: error
        });
    }
}

async function _insertLinkHandler() {
    if (!this.quill) return;

    const urlInput = this.shadowRoot.getElementById('link-url');
    const textInput = this.shadowRoot.getElementById('link-text');
    const titleInput = this.shadowRoot.getElementById('link-title');

    const url = urlInput?.value?.trim();
    const text = textInput?.value?.trim();
    const title = titleInput?.value?.trim();

    if (!url) {
        await this.showModal({
            title: 'Ошибка',
            content: 'Пожалуйста, укажите URL ссылки',
            buttons: [{ text: 'OK', type: 'primary' }]
        });
        return;
    }

    const selection = this.quill.getSelection();
    if (selection) {
        if (text && text !== this.quill.getText(selection.index, selection.length)) {
            // Заменяем выделенный текст
            this.quill.deleteText(selection.index, selection.length);
            this.quill.insertText(selection.index, text, { link: url });
        } else {
            // Форматируем существующий текст
            this.quill.formatText(selection.index, selection.length, 'link', url);
        }

        // Обновляем состояние placeholder
        this._updatePlaceholderState();

        this.postMessage({
            type: 'link-inserted',
            url: url,
            text: text,
            title: title
        });
    }
}

async function toggleFormat(format, value = null) {
    if (!this.quill) return;

    try {
        // Сохраняем текущее выделение
        const selection = this.quill.getSelection();
        if (!selection) {
            // Если нет выделения, используем текущую позицию курсора
            const length = this.quill.getLength();
            this.quill.setSelection(length - 1, 0);
            return;
        }

        if (value === null) {
            // Переключаем текущее состояние
            const currentFormat = this.quill.getFormat(selection);
            value = !currentFormat[format];
        }

        this.quill.formatText(selection.index, selection.length, format, value);

        // Восстанавливаем выделение
        setTimeout(() => {
            try {
                this.quill.setSelection(selection);
            } catch (error) {
                console.warn('Не удалось восстановить выделение после форматирования:', error);
            }
        }, 0);

        this.postMessage({
            type: 'format-toggled',
            format: format,
            value: value
        });
    } catch (error) {
        console.error('Ошибка переключения формата:', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'toggleFormat',
            message: `Ошибка переключения формата: ${format}`,
            details: error
        });
    }
}

async function getFormats() {
    if (!this.quill) return {};

    try {
        const selection = this.quill.getSelection();
        if (selection) {
            return this.quill.getFormat(selection);
        }
        return {};
    } catch (error) {
        console.error('Ошибка получения форматов:', error);
        return {};
    }
}

async function exportContent(format = 'html') {
    try {
        const content = await this.getContent(format);

        // Создаем blob для скачивания
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `editor-content.${format === 'html' ? 'html' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.postMessage({
            type: 'content-exported',
            format: format,
            content: content,
            wordCount: this.state.wordCount,
            charCount: this.state.charCount
        });

        return content;
    } catch (error) {
        console.error('Ошибка экспорта контента:', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'exportContent',
            message: 'Ошибка экспорта содержимого',
            details: error
        });

        // Fallback - показываем в модальном окне
        const content = await this.getContent(format);
        await this.showModal({
            title: `Экспорт (${format.toUpperCase()})`,
            content: `
        <div style="max-height: 300px; overflow: auto;">
          <pre style="background: var(--surface-100); padding: var(--space); border-radius: var(--radius); white-space: pre-wrap; font-size: 12px;">${content}</pre>
        </div>
      `,
            buttons: [
                {
                    text: 'Копировать',
                    type: 'primary',
                    action: () => {
                        navigator.clipboard.writeText(content);
                    }
                },
                {
                    text: 'Закрыть',
                    type: 'secondary'
                }
            ]
        });

        return content;
    }
}

async function toggleTheme() {
    try {
        const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.setAttribute('theme', newTheme);

        this.postMessage({
            type: 'theme-changed',
            theme: newTheme
        });
    } catch (error) {
        console.error('Ошибка переключения темы:', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'toggleTheme',
            message: 'Ошибка переключения темы',
            details: error
        });
    }
}

async function focus() {
    if (this.quill) {
        this.quill.focus();

        this.postMessage({
            type: 'editor-focused'
        });
    }
}

async function blur() {
    if (this.quill) {
        this.quill.blur();

        this.postMessage({
            type: 'editor-blurred'
        });
    }
}

async function enable() {
    if (this.quill) {
        this.quill.enable(true);
        this.state.readOnly = false;

        this.postMessage({
            type: 'editor-enabled'
        });
    }
}

async function disable() {
    if (this.quill) {
        this.quill.enable(false);
        this.state.readOnly = true;

        this.postMessage({
            type: 'editor-disabled'
        });
    }
}

async function getStats() {
    if (!this.quill) return {};

    const text = this.quill.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const paragraphs = (text.match(/\n\s*\n/g) || []).length + 1;

    const stats = {
        words: words,
        characters: characters,
        paragraphs: paragraphs,
        readingTime: Math.ceil(words / 200) // среднее время чтения в минутах
    };

    this.postMessage({
        type: 'stats-calculated',
        stats: stats
    });

    return stats;
}

async function insertTable(rows = 3, cols = 3) {
    if (!this.quill) return;

    try {
        const selection = this.quill.getSelection();
        if (selection) {
            // Создаем простую HTML таблицу
            let tableHTML = '<table style="border-collapse: collapse; width: 100%;">';
            for (let i = 0; i < rows; i++) {
                tableHTML += '<tr>';
                for (let j = 0; j < cols; j++) {
                    tableHTML += `<td style="border: 1px solid #ccc; padding: 8px;">&nbsp;</td>`;
                }
                tableHTML += '</tr>';
            }
            tableHTML += '</table><br>';

            this.quill.clipboard.dangerouslyPasteHTML(selection.index, tableHTML);

            // Обновляем состояние placeholder
            this._updatePlaceholderState();

            this.postMessage({
                type: 'table-inserted',
                rows: rows,
                columns: cols
            });
        }
    } catch (error) {
        console.error('Ошибка вставки таблицы:', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'insertTable',
            message: 'Ошибка вставки таблицы',
            details: error
        });
    }
}

async function addEmbed(type, url) {
    if (!this.quill) return;

    try {
        const selection = this.quill.getSelection();
        if (selection) {
            let embedHTML = '';

            switch (type) {
                case 'youtube':
                    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                    if (videoId) {
                        embedHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId[1]}" frameborder="0" allowfullscreen></iframe>`;
                    }
                    break;
                case 'vimeo':
                    const vimeoId = url.match(/vimeo\.com\/(\d+)/);
                    if (vimeoId) {
                        embedHTML = `<iframe src="https://player.vimeo.com/video/${vimeoId[1]}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
                    }
                    break;
                case 'twitter':
                    embedHTML = `<blockquote class="twitter-tweet"><a href="${url}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`;
                    break;
                default:
                    console.warn(`Неизвестный тип embed: ${type}`);
                    return;
            }

            if (embedHTML) {
                this.quill.clipboard.dangerouslyPasteHTML(selection.index, embedHTML);

                // Обновляем состояние placeholder
                this._updatePlaceholderState();

                this.postMessage({
                    type: 'embed-inserted',
                    embedType: type,
                    url: url
                });
            }
        }
    } catch (error) {
        console.error('Ошибка вставки embed:', error);
        this.addError({
            componentName: this.constructor.name,
            source: 'addEmbed',
            message: `Ошибка вставки embed: ${type}`,
            details: error
        });
    }
}

// Добавьте метод для обновления состояния placeholder
async function _updatePlaceholderState() {
    if (!this.quill) return;

    const isEmpty = this.quill.getText().trim() === '';
    const editorElement = this.quill.root;

    if (isEmpty) {
        editorElement.classList.add('ql-blank');
    } else {
        editorElement.classList.remove('ql-blank');
    }
}