import { BaseComponent } from '../../base/base-component.mjs';
import * as template from './template/index.mjs';
import { controller } from './controller/index.mjs';
import { createActions } from './actions/index.mjs';
import quill from 'https://cdn.jsdelivr.net/npm/quill@2.0.3/+esm'

export class WysiwygEditor extends BaseComponent {
    static observedAttributes = ['value', 'placeholder', 'read-only', 'theme', 'height'];

    constructor() {
        super();
        this._templateMethods = template;
        this.state = {
            value: '',
            placeholder: 'Начните вводить текст...',
            readOnly: false,
            theme: 'light',
            height: '300px',
            formats: [],
            wordCount: 0,
            charCount: 0,
            paragraphCount: 0,
            id: this._id
        };

        window.Quill = quill;
        this.quill = null;
        this.quillLoaded = false;
        this._lastKnownSelection = null;
        this._isRestoringSelection = false;
        this._mutationObserver = null;
        this._ignoreNextSelectionChange = false;

        // Привязываем методы для использования в слушателях
        this._boundHandleTextChange = this._handleTextChange.bind(this);
        this._boundHandleSelectionChange = this._handleSelectionChange.bind(this);
    }

    /**
     * Правильная реализация postMessage для входящих сообщений
     * @param {Object} message - Входящее сообщение
     * @param {string} message.type - Тип сообщения
     * @param {*} message.data - Данные сообщения
     * @param {string} message.source - Источник сообщения
     * @returns {Promise<Object>} Ответ на сообщение
     */
    async postMessage(message) {
        const { type, data, source } = message;

        console.log(`[WysiwygEditor] Получено сообщение от ${source}:`, { type, data });

        const messageHandlers = {
            // Запрос состояния редактора
            'get-editor-state': async () => {
                const state = await this.getEditorState();
                return {
                    success: true,
                    data: state,
                    component: this.constructor.name,
                    id: this.id
                };
            },

            // Установка содержимого редактора
            'set-content': async () => {
                if (data && data.content !== undefined) {
                    await this._actions.setContent(data.content, data.format || 'html');
                    return {
                        success: true,
                        message: 'Content set successfully',
                        wordCount: this.state.wordCount,
                        charCount: this.state.charCount
                    };
                }
                return { success: false, error: 'No content provided' };
            },

            // Очистка редактора
            'clear-content': async () => {
                await this._actions.clearContent();
                return {
                    success: true,
                    message: 'Editor cleared successfully'
                };
            },

            // Применение форматирования
            'apply-format': async () => {
                if (data && data.format) {
                    await this._actions.toggleFormat(data.format, data.value);
                    return {
                        success: true,
                        message: `Format ${data.format} applied`,
                        formats: this.state.formats
                    };
                }
                return { success: false, error: 'No format specified' };
            },

            // Экспорт содержимого
            'export-content': async () => {
                const content = await this._actions.getContent(data?.format || 'html');
                return {
                    success: true,
                    data: {
                        content,
                        format: data?.format || 'html',
                        wordCount: this.state.wordCount,
                        charCount: this.state.charCount,
                        paragraphCount: this.state.paragraphCount
                    }
                };
            },

            // Фокус на редактор
            'focus-editor': async () => {
                await this._actions.focus();
                return {
                    success: true,
                    message: 'Editor focused'
                };
            },

            // Запрос статистики
            'get-stats': async () => {
                const stats = await this._actions.getStats();
                return {
                    success: true,
                    data: stats
                };
            },

            // Вставка текста
            'insert-text': async () => {
                if (data && data.text) {
                    await this._actions.insertText(data.text, data.formats || {});
                    return {
                        success: true,
                        message: 'Text inserted successfully'
                    };
                }
                return { success: false, error: 'No text provided' };
            },

            // Вставка HTML
            'insert-html': async () => {
                if (data && data.html) {
                    await this._actions.insertHTML(data.html);
                    return {
                        success: true,
                        message: 'HTML inserted successfully'
                    };
                }
                return { success: false, error: 'No HTML provided' };
            },

            // Переключение темы
            'toggle-theme': async () => {
                await this._actions.toggleTheme();
                return {
                    success: true,
                    message: 'Theme toggled',
                    theme: this.state.theme
                };
            },

            // Включение/выключение редактора
            'set-readonly': async () => {
                if (data && typeof data.readOnly === 'boolean') {
                    if (data.readOnly) {
                        await this._actions.disable();
                    } else {
                        await this._actions.enable();
                    }
                    return {
                        success: true,
                        message: `Editor ${data.readOnly ? 'disabled' : 'enabled'}`,
                        readOnly: this.state.readOnly
                    };
                }
                return { success: false, error: 'No readOnly value provided' };
            },

            // Вставка изображения
            'insert-image': async () => {
                if (data && data.url) {
                    await this._actions.insertImage(data.url, data.alt || '');
                    return {
                        success: true,
                        message: 'Image inserted successfully'
                    };
                }
                return { success: false, error: 'No image URL provided' };
            },

            // Вставка ссылки
            'insert-link': async () => {
                await this._actions.insertLink();
                return {
                    success: true,
                    message: 'Link insertion dialog opened'
                };
            },

            // Вставка таблицы
            'insert-table': async () => {
                const rows = data?.rows || 3;
                const cols = data?.cols || 3;
                await this._actions.insertTable(rows, cols);
                return {
                    success: true,
                    message: 'Table inserted successfully',
                    rows,
                    columns: cols
                };
            },

            // Получение текущих форматов
            'get-formats': async () => {
                const formats = await this._actions.getFormats();
                return {
                    success: true,
                    data: formats
                };
            }
        };

        // Обрабатываем сообщение
        if (messageHandlers[type]) {
            try {
                const response = await messageHandlers[type]();
                console.log(`[WysiwygEditor] Обработано сообщение ${type}:`, response);
                return response;
            } catch (error) {
                console.error(`[WysiwygEditor] Ошибка обработки сообщения ${type}:`, error);
                this.addError({
                    componentName: this.constructor.name,
                    source: 'postMessage',
                    message: `Ошибка обработки сообщения ${type}`,
                    details: error
                });
                return {
                    success: false,
                    error: error.message,
                    component: this.constructor.name,
                    id: this.id
                };
            }
        }

        // Сообщение не распознано
        console.warn(`[WysiwygEditor] Неизвестный тип сообщения:`, type);
        return {
            success: false,
            error: `Unknown message type: ${type}`,
            component: this.constructor.name,
            id: this.id
        };
    }

    /**
     * Отправляет сообщение другому компоненту
     * @param {string} targetComponent - Имя целевого компонента
     * @param {string} targetId - ID целевого компонента
     * @param {string} type - Тип сообщения
     * @param {*} data - Данные сообщения
     * @returns {Promise<Object>} Ответ от целевого компонента
     */
    async sendMessageToComponent(targetComponent, targetId, type, data = {}) {
        try {
            const target = await this.getComponentAsync(targetComponent, targetId);
            if (target && typeof target.postMessage === 'function') {
                const response = await target.postMessage({
                    type,
                    data,
                    source: `${this.constructor.name}:${this.id}`
                });
                return response;
            } else {
                console.warn(`Целевой компонент ${targetComponent}:${targetId} не найден или не поддерживает postMessage`);
                return { success: false, error: 'Target component not found' };
            }
        } catch (error) {
            console.error(`Ошибка отправки сообщения компоненту ${targetComponent}:${targetId}:`, error);
            this.addError({
                componentName: this.constructor.name,
                source: 'sendMessageToComponent',
                message: `Ошибка отправки сообщения компоненту ${targetComponent}`,
                details: error
            });
            return { success: false, error: error.message };
        }
    }

    async _componentReady() {
        this._controller = await controller(this);
        this._actions = await createActions(this);

        await this.fullRender(this.state);

        // Инициализация редактора
        await this._initEditor();

        return true;
    }

    async _initEditor() {
        // Ждем полного рендера DOM
        await new Promise(resolve => setTimeout(resolve, 100));

        const container = this.shadowRoot.getElementById(`editor-${this._id}`);
        if (!container) {
            console.error('Контейнер редактора не найден, перепроверяем...');
            await new Promise(resolve => setTimeout(resolve, 200));
            const retryContainer = this.shadowRoot.getElementById(`editor-${this._id}`);
            if (!retryContainer) {
                throw new Error(`Контейнер редактора #editor-${this._id} не найден после повторной попытки`);
            }
        }

        if (!window.Quill) {
            throw new Error('Quill.js не загружен');
        }

        // Настройки Quill
        const toolbarOptions = [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean']
        ];

        try {
            this.quill = new window.Quill(container, {
                modules: {
                    toolbar: toolbarOptions,
                    history: {
                        delay: 1000,
                        maxStack: 100,
                        userOnly: true
                    }
                },
                placeholder: this.state.placeholder,
                readOnly: this.state.readOnly,
                theme: 'snow',
                formats: [
                    'header', 'bold', 'italic', 'underline', 'strike',
                    'color', 'background', 'list', 'indent', 'align',
                    'blockquote', 'code-block', 'link', 'image'
                ]
            });

            // Установка начального значения из атрибута
            const initialValue = this.getAttribute('value');
            if (initialValue) {
                this.quill.root.innerHTML = initialValue;
                this.state.value = initialValue;
            }

            // Настройка слушателей событий
            await this._setupQuillEventListeners();

            // Устанавливаем курсор в начало после инициализации
            setTimeout(() => {
                if (this.quill) {
                    const length = this.quill.getLength();
                    if (length > 1) {
                        this.quill.setSelection(0, 0, 'silent');
                        this._lastKnownSelection = { index: 0, length: 0, timestamp: Date.now() };
                    } else {
                        this._lastKnownSelection = { index: 0, length: 0, timestamp: Date.now() };
                    }
                    this._updateCurrentFormats();
                    console.log('Editor initialized with cursor at start');
                }
            }, 100);

            // Настройка наблюдения за ресайзом
            await this._setupResizeObserver();

            // Применение кастомных стилей
            await this._applyCustomStyles();

            // Обновляем статистику
            await this._updateContentStats();

            console.log(`WYSIWYG редактор инициализирован с ID: ${this._id}`);
        } catch (error) {
            console.error('Ошибка инициализации Quill:', error);
            throw error;
        }
    }

    async _setupQuillEventListeners() {
        if (!this.quill) return;
        const editorElement = this.quill.root;

        editorElement.addEventListener('input', this._boundHandleTextChange);
        editorElement.addEventListener('keyup', (e) => {
            this._boundHandleTextChange();
            if (e.key === 'Enter') {
                this._correctCursorPosition();
            }
        });
        editorElement.addEventListener('keydown', this._boundHandleTextChange);

        editorElement.addEventListener('click', this._boundHandleSelectionChange);
        editorElement.addEventListener('mouseup', this._boundHandleSelectionChange);
        editorElement.addEventListener('keyup', this._boundHandleSelectionChange);

        await this._setupMutationObserver();

        console.log('Quill event listeners setup completed');
    }

    async _setupMutationObserver() {
        if (!this.quill) return;

        this._mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    setTimeout(() => {
                        this._boundHandleTextChange();
                    }, 0);
                }
            });
        });

        this._mutationObserver.observe(this.quill.root, {
            childList: true,
            subtree: true,
            characterData: true
        });

        console.log('MutationObserver setup completed');
    }

    async _handleTextChange(delta, oldDelta, source) {
        if (!this.quill || this._isRestoringSelection) return;

        const contents = this.quill.root.innerHTML;
        const text = this.quill.getText();

        this.state.value = contents;
        await this._updateContentStats();

        await this._saveCurrentSelection();

        setTimeout(() => {
            this._updateCurrentFormats();
        }, 0);
    }

    async _handleSelectionChange(range, oldRange, source) {
        if (!this.quill) return;

        if (this._isRestoringSelection || this._ignoreNextSelectionChange) {
            console.log('Ignoring selection change during restoration');
            this._ignoreNextSelectionChange = false;
            return;
        }

        console.log('Selection changed:', { range, source });

        if (range) {
            this._lastKnownSelection = {
                index: range.index,
                length: range.length,
                timestamp: Date.now()
            };

            await this._updateCurrentFormats();
        }
    }

    async _correctCursorPosition() {
        if (!this.quill) return;

        const selection = this.quill.getSelection();
        if (!selection) return;

        const text = this.quill.getText();

        if (selection.index > 0 && selection.length === 0) {
            const prevChar = text.charAt(selection.index - 1);
            const nextChar = text.charAt(selection.index);

            if (prevChar === '\n' && nextChar !== '\n') {
                setTimeout(() => {
                    try {
                        this.quill.setSelection(selection.index, 0, 'silent');
                    } catch (error) {
                        console.warn('Ошибка коррекции курсора:', error);
                    }
                }, 10);
            }
        }
    }

    async _saveCurrentSelection() {
        if (!this.quill) return;

        try {
            const selection = this.quill.getSelection();
            if (selection) {
                this._lastKnownSelection = {
                    index: selection.index,
                    length: selection.length,
                    timestamp: Date.now()
                };
                console.log('Selection saved:', this._lastKnownSelection);
            }
        } catch (error) {
            console.warn('Error saving selection:', error);
        }
    }

    async _restoreSelection() {
        if (!this.quill || !this._lastKnownSelection) return;

        this._isRestoringSelection = true;
        this._ignoreNextSelectionChange = true;

        try {
            const length = this.quill.getLength();
            let safeIndex = Math.max(0, Math.min(this._lastKnownSelection.index, length - 1));
            let safeLength = Math.max(0, Math.min(this._lastKnownSelection.length, length - safeIndex));

            if (length <= 1) {
                safeIndex = 0;
                safeLength = 0;
            }

            console.log('Restoring selection:', {
                original: this._lastKnownSelection,
                safe: { index: safeIndex, length: safeLength },
                documentLength: length
            });

            setTimeout(() => {
                try {
                    this.quill.setSelection(safeIndex, safeLength, 'silent');

                    this._lastKnownSelection = {
                        index: safeIndex,
                        length: safeLength,
                        timestamp: Date.now()
                    };

                    console.log('Selection successfully restored');

                } catch (error) {
                    console.warn('Error in selection restoration:', error);

                    try {
                        this.quill.setSelection(0, 0, 'silent');
                    } catch (fallbackError) {
                        console.error('Fallback selection also failed:', fallbackError);
                    }
                }
            }, 0);

        } catch (error) {
            console.warn('Error preparing selection restoration:', error);
        } finally {
            setTimeout(() => {
                this._isRestoringSelection = false;
                this._ignoreNextSelectionChange = false;
            }, 50);
        }
    }

    async _updateCurrentFormats() {
        if (!this.quill) return;

        try {
            let selection = this.quill.getSelection();

            if (!selection && this._lastKnownSelection) {
                const timeDiff = Date.now() - this._lastKnownSelection.timestamp;
                if (timeDiff < 5000) {
                    selection = this._lastKnownSelection;
                }
            }

            if (!selection) {
                return;
            }

            const format = this.quill.getFormat(selection);
            this.state.formats = Object.keys(format).filter(key => format[key]);
            await this._updateFormatsDisplay();

        } catch (error) {
            console.warn('Error updating formats:', error);
        }
    }

    async _updateContentStats() {
        if (!this.quill) return;

        const text = this.quill.getText().trim();
        const html = this.quill.root.innerHTML;

        const textWithoutTags = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const words = textWithoutTags ? textWithoutTags.split(/\s+/).length : 0;

        const characters = text.replace(/\s/g, '').length;

        const paragraphs = (html.match(/<p[^>]*>/g) || []).length;

        this.state.wordCount = words;
        this.state.charCount = characters;
        this.state.paragraphCount = paragraphs;

        await this._updateStatsDisplay();
    }

    async _setupResizeObserver() {
        if (!this.quill) return;

        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                this._handleResize(entry);
            }
        });

        const editorElement = this.shadowRoot.querySelector('.ql-editor');
        if (editorElement) {
            this.resizeObserver.observe(editorElement);
        }
    }

    async _handleResize(entry) {
        // Можно добавить логику обработки ресайза при необходимости
        console.log('Editor resized:', entry.contentRect);
    }

    async _applyCustomStyles() {
        if (!this.quill) return;

        const editorContainer = this.shadowRoot.querySelector('.ql-container');
        if (editorContainer && this.state.height) {
            editorContainer.style.height = this.state.height;
            editorContainer.style.minHeight = this.state.height;
        }
    }

    async _updateStatsDisplay() {
        await this.updateElement({
            selector: '#wordCount',
            value: this.state.wordCount.toString(),
            property: 'textContent'
        });

        await this.updateElement({
            selector: '#charCount',
            value: this.state.charCount.toString(),
            property: 'textContent'
        });

        await this.updateElement({
            selector: '#paragraphCount',
            value: this.state.paragraphCount.toString(),
            property: 'textContent'
        });
    }

    async _updateFormatsDisplay() {
        const formats = this.state.formats?.join(', ') || 'Normal text';
        await this.updateElement({
            selector: '#formatsDisplay',
            value: formats,
            property: 'textContent'
        });
    }

    async _componentAttributeChanged(name, oldValue, newValue) {
        if (!this.quill) return;

        const attributeHandlers = {
            'value': async () => {
                if (newValue !== this.state.value) {
                    await this._actions.setContent(newValue, 'html');
                }
            },
            'placeholder': async () => {
                this.quill.root.setAttribute('data-placeholder', newValue);
                this.state.placeholder = newValue;
            },
            'read-only': async () => {
                const isReadOnly = newValue !== null;
                this.quill.enable(!isReadOnly);
                this.state.readOnly = isReadOnly;
            },
            'theme': async () => {
                this.state.theme = newValue;
                await this._applyTheme();
            },
            'height': async () => {
                this.state.height = newValue;
                await this._applyCustomStyles();
            }
        };

        if (attributeHandlers[name]) {
            await attributeHandlers[name]();
        }
    }

    async _applyTheme() {
        const editorElement = this.shadowRoot.querySelector('.wysiwyg-editor');
        if (editorElement) {
            editorElement.setAttribute('data-theme', this.state.theme);
        }
    }

    async _componentDisconnected() {
        await this._cleanupEventListeners();

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
        }

        if (this.quill) {
            this.quill.off('text-change');
            this.quill.off('selection-change');
        }

        if (this._controller?.destroy) {
            await this._controller.destroy();
        }
    }

    async _cleanupEventListeners() {
        if (!this.quill) return;

        const editorElement = this.quill.root;

        editorElement.removeEventListener('input', this._boundHandleTextChange);
        editorElement.removeEventListener('keyup', this._boundHandleTextChange);
        editorElement.removeEventListener('keydown', this._boundHandleTextChange);
        editorElement.removeEventListener('click', this._boundHandleSelectionChange);
        editorElement.removeEventListener('mouseup', this._boundHandleSelectionChange);
        editorElement.removeEventListener('keyup', this._boundHandleSelectionChange);
    }

    // Публичные методы для API (используют actions)
    async getEditorState() {
        return {
            value: this.state.value,
            wordCount: this.state.wordCount,
            charCount: this.state.charCount,
            paragraphCount: this.state.paragraphCount,
            formats: this.state.formats,
            readOnly: this.state.readOnly,
            theme: this.state.theme
        };
    }

    // Методы для удобства использования компонента
    async getContent(format = 'html') {
        return await this._actions.getContent(format);
    }

    async setContent(content, format = 'html') {
        return await this._actions.setContent(content, format);
    }

    async clearContent() {
        return await this._actions.clearContent();
    }

    async insertText(text, formats = {}) {
        return await this._actions.insertText(text, formats);
    }

    async insertHTML(html) {
        return await this._actions.insertHTML(html);
    }

    async toggleFormat(format, value = null) {
        return await this._actions.toggleFormat(format, value);
    }

    async focusEditor() {
        return await this._actions.focus();
    }

    async blurEditor() {
        return await this._actions.blur();
    }

    async enableEditor() {
        return await this._actions.enable();
    }

    async disableEditor() {
        return await this._actions.disable();
    }

    async toggleTheme() {
        return await this._actions.toggleTheme();
    }

    async getStats() {
        return await this._actions.getStats();
    }

    async exportContent(format = 'html') {
        return await this._actions.exportContent(format);
    }
}

if (!customElements.get('wysiwyg-editor')) {
    customElements.define('wysiwyg-editor', WysiwygEditor);
}