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
     * Отправляет сообщение другим компонентам системы
     * @param {Object} message - Объект сообщения
     * @param {string} message.type - Тип сообщения
     * @param {*} [message.data] - Данные сообщения
     * @param {string} [message.target] - Целевой компонент (опционально)
     * @param {string} [message.source] - Источник сообщения (по умолчанию имя компонента)
     * @returns {Promise<Object>} Ответ от получателя
     */
    async postMessage(message) {
        const { type, data, target, source = this.constructor.name } = message;

        console.trace()
        // Логируем отправку сообщения
        console.log(`[WysiwygEditor] Отправка сообщения:`, {
            type,
            source,
            target,
            data,
            timestamp: new Date().toISOString()
        });

        // Если указан целевой компонент, отправляем сообщение напрямую
        if (target) {
            try {
                const [componentName, componentId] = target.split(':');
                const targetComponent = await this.getComponentAsync(componentName, componentId);

                if (targetComponent && typeof targetComponent.postMessage === 'function') {
                    const response = await targetComponent.postMessage({
                        type,
                        data,
                        source: this.constructor.name,
                        target: `${this.constructor.name}:${this.id}`
                    });
                    return response;
                } else {
                    console.warn(`[WysiwygEditor] Целевой компонент не найден или не поддерживает postMessage:`, target);
                    return { success: false, error: 'Target component not found' };
                }
            } catch (error) {
                console.error(`[WysiwygEditor] Ошибка отправки сообщения компоненту ${target}:`, error);
                return { success: false, error: error.message };
            }
        }

        // Глобальная рассылка сообщения всем заинтересованным компонентам
        const eventDetail = {
            type,
            data,
            source: this.constructor.name,
            sourceId: this.id,
            timestamp: Date.now()
        };

        // Отправляем кастомное событие для глобальной коммуникации
        const event = new CustomEvent('yato-component-message', {
            detail: eventDetail,
            bubbles: true,
            composed: true
        });

        this.dispatchEvent(event);

        // Возвращаем подтверждение отправки
        return {
            success: true,
            message: 'Message sent successfully',
            timestamp: eventDetail.timestamp
        };
    }

    /**
     * Обрабатывает входящие сообщения от других компонентов
     * @param {Object} message - Входящее сообщение
     * @param {string} message.type - Тип сообщения
     * @param {*} message.data - Данные сообщения
     * @param {string} message.source - Источник сообщения
     * @returns {Promise<Object>} Ответ на сообщение
     */
    async handleIncomingMessage(message) {
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
                    await this.setContent(data.content, data.format || 'html');
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
                await this.clearContent();
                return {
                    success: true,
                    message: 'Editor cleared successfully'
                };
            },

            // Применение форматирования
            'apply-format': async () => {
                if (data && data.format) {
                    await this.toggleFormat(data.format, data.value);
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
                const content = await this.getContent(data?.format || 'html');
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
                await this.focusEditor();
                return {
                    success: true,
                    message: 'Editor focused'
                };
            },

            // Запрос статистики
            'get-stats': async () => {
                const stats = await this.getStats();
                return {
                    success: true,
                    data: stats
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

    async _componentReady() {
        this._controller = await controller(this);
        this._actions = await createActions(this);

        // Устанавливаем обработчик входящих сообщений
        this._setupMessageListener();

        await this.fullRender(this.state);

        // Инициализация редактора
        await this._initEditor();

        // Отправляем сообщение о готовности
        await this.postMessage({
            type: 'component-ready',
            data: {
                component: this.constructor.name,
                id: this.id,
                capabilities: ['edit', 'format', 'export', 'stats']
            }
        });

        return true;
    }

    /**
     * Настраивает слушатель для входящих сообщений
     */
    _setupMessageListener() {
        this._messageHandler = (event) => {
            // Проверяем, адресовано ли сообщение этому компоненту
            const message = event.detail;
            if (message && this._shouldHandleMessage(message)) {
                this.handleIncomingMessage(message).then(response => {
                    // Отправляем ответ обратно отправителю, если нужно
                    if (message.requireResponse && message.source) {
                        this.postMessage({
                            type: 'response',
                            data: response,
                            target: message.source,
                            source: this.constructor.name
                        });
                    }
                });
            }
        };

        // Слушаем глобальные события компонентов
        window.addEventListener('yato-component-message', this._messageHandler);
    }

    /**
     * Проверяет, должно ли сообщение быть обработано этим компонентом
     */
    _shouldHandleMessage(message) {
        // Если сообщение адресовано конкретно этому компоненту
        if (message.target && message.target === `${this.constructor.name}:${this.id}`) {
            return true;
        }

        // Если сообщение широковещательное и соответствует нашим типам
        const broadcastTypes = [
            'get-editor-state',
            'set-content',
            'clear-content',
            'apply-format',
            'export-content',
            'focus-editor',
            'get-stats'
        ];

        return !message.target && broadcastTypes.includes(message.type);
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

            // ПРАВИЛЬНАЯ НАСТРОЙКА СЛУШАТЕЛЕЙ ДЛЯ SHADOW DOM
            this._setupQuillEventListeners();

            // Устанавливаем курсор в начало после инициализации с небольшой задержкой
            setTimeout(() => {
                if (this.quill) {
                    // Если есть контент, устанавливаем курсор в начало
                    const length = this.quill.getLength();
                    if (length > 1) {
                        this.quill.setSelection(0, 0, 'silent');
                        this._lastKnownSelection = { index: 0, length: 0, timestamp: Date.now() };
                    } else {
                        // Если документ пустой, курсор уже в правильном положении
                        this._lastKnownSelection = { index: 0, length: 0, timestamp: Date.now() };
                    }
                    this._updateCurrentFormats();
                    console.log('Editor initialized with cursor at start');
                }
            }, 100);

            // Настройка наблюдения за ресайзом
            this._setupResizeObserver();

            // Применение кастомных стилей
            this._applyCustomStyles();

            // Обновляем статистику
            this._updateContentStats();

            console.log(`WYSIWYG редактор инициализирован с ID: ${this._id}`);
        } catch (error) {
            console.error('Ошибка инициализации Quill:', error);
            throw error;
        }
    }

    // НОВЫЙ МЕТОД: Настройка слушателей событий Quill для Shadow DOM
    _setupQuillEventListeners() {
        if (!this.quill) return;
        const editorElement = this.quill.root;

        // Слушаем события ввода
        editorElement.addEventListener('input', this._boundHandleTextChange);
        editorElement.addEventListener('keyup', (e) => {
            this._boundHandleTextChange();
            if (e.key === 'Enter') {
                this._correctCursorPosition();
            }
        });
        editorElement.addEventListener('keydown', this._boundHandleTextChange);

        // Слушаем события выделения
        editorElement.addEventListener('click', this._boundHandleSelectionChange);
        editorElement.addEventListener('mouseup', this._boundHandleSelectionChange);
        editorElement.addEventListener('keyup', this._boundHandleSelectionChange);

        // Способ 3: MutationObserver для отслеживания изменений DOM
        this._setupMutationObserver();

        console.log('Quill event listeners setup completed');
    }

    /**
     * Настройка MutationObserver для отслеживания изменений DOM
     */
    _setupMutationObserver() {
        if (!this.quill) return;

        this._mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    // Задержка для стабилизации DOM
                    setTimeout(() => {
                        this._boundHandleTextChange();
                    }, 0);
                }
            });
        });

        // Наблюдаем за изменениями в редакторе
        this._mutationObserver.observe(this.quill.root, {
            childList: true,
            subtree: true,
            characterData: true
        });

        console.log('MutationObserver setup completed');
    }

    _handleTextChange(delta, oldDelta, source) {
        if (!this.quill || this._isRestoringSelection) return;

        const contents = this.quill.root.innerHTML;
        const text = this.quill.getText();

        this.state.value = contents;
        this._updateContentStats();

        // Сохраняем текущее выделение
        this._saveCurrentSelection();

        // Обновляем форматы с небольшой задержкой
        setTimeout(() => {
            this._updateCurrentFormats();
        }, 0);

        // Отправляем сообщение об изменении контента
        this.postMessage({
            type: 'content-changed',
            data: {
                content: contents,
                text: text,
                wordCount: this.state.wordCount,
                charCount: this.state.charCount,
                delta: delta
            }
        });
    }

    _handleSelectionChange(range, oldRange, source) {
        if (!this.quill) return;

        // Игнорируем события, если мы сами восстанавливаем выделение
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

            this._updateCurrentFormats();

            // Отправляем сообщение об изменении выделения
            this.postMessage({
                type: 'selection-changed',
                data: {
                    range: range,
                    formats: this.state.formats
                }
            });
        }
    }

    /**
     * Корректирует позицию курсора при переносе на новую строку
     * @private
     */
    _correctCursorPosition() {
        if (!this.quill) return;

        const selection = this.quill.getSelection();
        if (!selection) return;

        // Получаем текущий текст
        const text = this.quill.getText();

        // Если курсор находится в конце строки и следующий символ - перенос
        if (selection.index > 0 && selection.length === 0) {
            const prevChar = text.charAt(selection.index - 1);
            const nextChar = text.charAt(selection.index);

            // Если предыдущий символ - перенос строки, корректируем позицию
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

    // Сохраняет текущее выделение
    _saveCurrentSelection() {
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

    // Восстанавливает выделение
    _restoreSelection() {
        if (!this.quill || !this._lastKnownSelection) return;

        // Устанавливаем флаг, чтобы избежать рекурсии
        this._isRestoringSelection = true;
        this._ignoreNextSelectionChange = true;

        try {
            const length = this.quill.getLength();

            // Безопасное вычисление позиции
            let safeIndex = Math.max(0, Math.min(this._lastKnownSelection.index, length - 1));
            let safeLength = Math.max(0, Math.min(this._lastKnownSelection.length, length - safeIndex));

            // Если документ пустой, устанавливаем курсор в начало
            if (length <= 1) {
                safeIndex = 0;
                safeLength = 0;
            }

            console.log('Restoring selection:', {
                original: this._lastKnownSelection,
                safe: { index: safeIndex, length: safeLength },
                documentLength: length
            });

            // Используем setTimeout для гарантированного применения после обновления DOM
            setTimeout(() => {
                try {
                    this.quill.setSelection(safeIndex, safeLength, 'silent');

                    // Обновляем сохраненное выделение
                    this._lastKnownSelection = {
                        index: safeIndex,
                        length: safeLength,
                        timestamp: Date.now()
                    };

                    console.log('Selection successfully restored');

                } catch (error) {
                    console.warn('Error in selection restoration:', error);

                    // Запасной вариант: установить курсор в начало
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
            // Сбрасываем флаги с задержкой
            setTimeout(() => {
                this._isRestoringSelection = false;
                this._ignoreNextSelectionChange = false;
            }, 50);
        }
    }

    // Обновляет текущие форматы
    _updateCurrentFormats() {
        if (!this.quill) return;

        try {
            let selection = this.quill.getSelection();

            // Если нет текущего выделения, используем сохраненное (но только если оно свежее)
            if (!selection && this._lastKnownSelection) {
                const timeDiff = Date.now() - this._lastKnownSelection.timestamp;
                // Используем сохраненное выделение только если оно не старше 5 секунд
                if (timeDiff < 5000) {
                    selection = this._lastKnownSelection;
                }
            }

            // Если все еще нет выделения, не обновляем форматы
            if (!selection) {
                return;
            }

            const format = this.quill.getFormat(selection);
            this.state.formats = Object.keys(format).filter(key => format[key]);
            this._updateFormatsDisplay();

        } catch (error) {
            console.warn('Error updating formats:', error);
        }
    }

    _updateContentStats() {
        if (!this.quill) return;

        const text = this.quill.getText().trim();
        const html = this.quill.root.innerHTML;

        // Подсчет слов (игнорируем HTML теги)
        const textWithoutTags = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const words = textWithoutTags ? textWithoutTags.split(/\s+/).length : 0;

        // Подсчет символов (без пробелов)
        const characters = text.replace(/\s/g, '').length;

        // Подсчет параграфов
        const paragraphs = (html.match(/<p[^>]*>/g) || []).length;

        this.state.wordCount = words;
        this.state.charCount = characters;
        this.state.paragraphCount = paragraphs;

        this._updateStatsDisplay();
    }

    _setupResizeObserver() {
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

    _handleResize(entry) {
        this.postMessage({
            type: 'editor-resized',
            data: {
                width: entry.contentRect.width,
                height: entry.contentRect.height
            }
        });
    }

    _applyCustomStyles() {
        if (!this.quill) return;

        // Применение высоты редактора
        const editorContainer = this.shadowRoot.querySelector('.ql-container');
        if (editorContainer && this.state.height) {
            editorContainer.style.height = this.state.height;
            editorContainer.style.minHeight = this.state.height;
        }
    }

    _updateStatsDisplay() {
        this.updateElement({
            selector: '#wordCount',
            value: this.state.wordCount.toString(),
            property: 'textContent'
        });

        this.updateElement({
            selector: '#charCount',
            value: this.state.charCount.toString(),
            property: 'textContent'
        });

        this.updateElement({
            selector: '#paragraphCount',
            value: this.state.paragraphCount.toString(),
            property: 'textContent'
        });
    }

    _updateFormatsDisplay() {
        const formats = this.state.formats?.join(', ') || 'Normal text';
        this.updateElement({
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
                    await this.setContent(newValue, 'html');
                }
            },
            'placeholder': () => {
                this.quill.root.setAttribute('data-placeholder', newValue);
                this.state.placeholder = newValue;
            },
            'read-only': () => {
                const isReadOnly = newValue !== null;
                this.quill.enable(!isReadOnly);
                this.state.readOnly = isReadOnly;
            },
            'theme': () => {
                this.state.theme = newValue;
                this._applyTheme();
            },
            'height': () => {
                this.state.height = newValue;
                this._applyCustomStyles();
            }
        };

        if (attributeHandlers[name]) {
            await attributeHandlers[name]();
        }
    }

    _applyTheme() {
        const editorElement = this.shadowRoot.querySelector('.wysiwyg-editor');
        if (editorElement) {
            editorElement.setAttribute('data-theme', this.state.theme);
        }
    }

    async _componentDisconnected() {
        // Очистка слушателей сообщений
        if (this._messageHandler) {
            window.removeEventListener('yato-component-message', this._messageHandler);
        }

        // Очистка слушателей событий
        this._cleanupEventListeners();

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

        // Отправляем сообщение об отключении
        await this.postMessage({
            type: 'component-disconnected',
            data: {
                component: this.constructor.name,
                id: this.id
            }
        });
    }

    // НОВЫЙ МЕТОД: Очистка слушателей событий
    _cleanupEventListeners() {
        if (!this.quill) return;

        const editorElement = this.quill.root;

        // Удаляем все добавленные слушатели
        editorElement.removeEventListener('input', this._boundHandleTextChange);
        editorElement.removeEventListener('keyup', this._boundHandleTextChange);
        editorElement.removeEventListener('keydown', this._boundHandleTextChange);
        editorElement.removeEventListener('click', this._boundHandleSelectionChange);
        editorElement.removeEventListener('mouseup', this._boundHandleSelectionChange);
        editorElement.removeEventListener('keyup', this._boundHandleSelectionChange);
    }

    // Публичные методы для API
    async getContent(format = 'html') {
        if (!this.quill) return '';

        switch (format) {
            case 'html':
                return this.quill.root.innerHTML;
            case 'text':
                return this.quill.getText();
            case 'delta':
                return this.quill.getContents();
            default:
                return this.quill.root.innerHTML;
        }
    }

    async setContent(content, format = 'html') {
        if (!this.quill) return;

        // Сохраняем выделение перед изменением контента
        this._saveCurrentSelection();

        this._isRestoringSelection = true;

        try {
            // Получаем текущую длину документа
            const oldLength = this.quill.getLength();

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

            this.state.value = this.quill.root.innerHTML;
            this._updateContentStats();

            // Ждем обновления DOM и восстанавливаем выделение
            setTimeout(() => {
                this._restoreSelection();
                this._updateCurrentFormats();
            }, 10);

        } catch (error) {
            console.error('Ошибка установки контента:', error);
            this.addError({
                componentName: this.constructor.name,
                source: 'setContent',
                message: 'Ошибка установки содержимого редактора',
                details: error
            });
        } finally {
            setTimeout(() => {
                this._isRestoringSelection = false;
            }, 100);
        }
    }

    async clearContent() {
        if (!this.quill) return;

        const length = this.quill.getLength();
        this.quill.deleteText(0, length);
    }

    async insertText(text, formats = {}) {
        if (!this.quill) return;

        const selection = this.quill.getSelection();
        if (selection) {
            this.quill.insertText(selection.index, text, formats);
            this.quill.setSelection(selection.index + text.length, 0);
        }
    }

    async insertHTML(html) {
        if (!this.quill) return;

        const selection = this.quill.getSelection();
        if (selection) {
            const delta = this.quill.clipboard.convert(html);
            this.quill.updateContents(delta);
        }
    }

    async focusEditor() {
        if (this.quill) {
            this.quill.focus();
        }
    }

    async blurEditor() {
        if (this.quill) {
            this.quill.blur();
        }
    }

    async getFormats() {
        if (!this.quill) return {};

        const selection = this.quill.getSelection();
        if (selection) {
            return this.quill.getFormat(selection);
        }
        return {};
    }

    async toggleFormat(format, value = null) {
        if (!this.quill) return;

        try {
            // Сохраняем текущее выделение перед операцией
            this._saveCurrentSelection();

            let selection = this.quill.getSelection();

            // Если нет выделения, используем сохраненное (только свежее)
            if (!selection && this._lastKnownSelection) {
                const timeDiff = Date.now() - this._lastKnownSelection.timestamp;
                if (timeDiff < 5000) {
                    selection = this._lastKnownSelection;
                }
            }

            if (!selection) {
                console.warn('No selection available for formatting');
                return;
            }

            if (value === null) {
                const currentFormat = this.quill.getFormat(selection);
                value = !currentFormat[format];
            }

            // Применяем форматирование
            this.quill.formatText(selection.index, selection.length, format, value);

            // Восстанавливаем выделение после форматирования
            setTimeout(() => {
                this._restoreSelection();
                this._updateCurrentFormats();
            }, 10);

            this.postMessage({
                type: 'format-toggled',
                data: {
                    format: format,
                    value: value
                }
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

    // Метод для принудительной установки курсора в начало
    async setCursorToStart() {
        if (!this.quill) return;

        try {
            this.quill.setSelection(0, 0, 'silent');
            this._lastKnownSelection = { index: 0, length: 0, timestamp: Date.now() };
            console.log('Cursor set to start');
        } catch (error) {
            console.warn('Error setting cursor to start:', error);
        }
    }

    // Метод для принудительной установки курсора в конец
    async setCursorToEnd() {
        if (!this.quill) return;

        try {
            const length = this.quill.getLength();
            this.quill.setSelection(length, 0, 'silent');
            this._lastKnownSelection = { index: length, length: 0, timestamp: Date.now() };
            console.log('Cursor set to end');
        } catch (error) {
            console.warn('Error setting cursor to end:', error);
        }
    }

    // Метод для получения состояния редактора
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
}

if (!customElements.get('wysiwyg-editor')) {
    customElements.define('wysiwyg-editor', WysiwygEditor);
}