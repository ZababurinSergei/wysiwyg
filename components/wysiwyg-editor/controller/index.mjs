export const controller = (context) => {
    let eventListeners = [];
    let currentSelection = null;

    const addEventListener = (element, event, handler) => {
        element.addEventListener(event, handler);
        eventListeners.push({ element, event, handler });
    };

    // Сохранение текущего выделения
    const saveSelection = () => {
        if (context.quill) {
            currentSelection = context.quill.getSelection();
        }
    };

    // Восстановление выделения
    const restoreSelection = () => {
        if (context.quill && currentSelection) {
            try {
                context.quill.setSelection(currentSelection);
            } catch (error) {
                console.warn('Не удалось восстановить выделение:', error);
            }
        }
    };

    // Обработчик для сохранения выделения перед действиями
    const withSelectionPreservation = (callback) => {
        return async (...args) => {
            saveSelection();
            const result = await callback(...args);
            // Восстанавливаем выделение после следующего тика event loop
            setTimeout(restoreSelection, 0);
            return result;
        };
    };

    return {
        async init() {
            // Ждем инициализации Quill
            await new Promise(resolve => setTimeout(resolve, 200));

            if (!context.quill) {
                console.warn('Quill не инициализирован');
                return;
            }

            // Сохраняем выделение при изменении
            context.quill.on('selection-change', (range, oldRange, source) => {
                console.log('---------- selection-change --------------', range)
                if (range) {
                    currentSelection = range;
                }
            });

            // Сохраняем выделение перед кликом по тулбару
            const toolbar = context.shadowRoot.querySelector('.ql-toolbar');
            if (toolbar) {
                addEventListener(toolbar, 'mousedown', (e) => {
                    if (e.target.closest('button') || e.target.closest('.ql-picker-label')) {
                        saveSelection();
                    }
                });

                addEventListener(toolbar, 'click', (e) => {
                    const target = e.target.closest('button');
                    if (!target) return;

                    // Восстанавливаем выделение после обработки клика Quill
                    setTimeout(() => {
                        if (currentSelection) {
                            try {
                                context.quill.setSelection(currentSelection);
                            } catch (error) {
                                console.warn('Не удалось восстановить выделение после клика:', error);
                            }
                        }
                    }, 10);
                });
            }

            // Обработчики для action bar с сохранением выделения
            const actionBar = context.shadowRoot.querySelector('.action-bar');
            if (actionBar) {
                const handlers = {
                    'export-html': withSelectionPreservation(() => context._actions.exportContent('html')),
                    'export-text': withSelectionPreservation(() => context._actions.exportContent('text')),
                    'clear-editor': withSelectionPreservation(() => context._actions.clearContent()),
                    'theme-toggle': withSelectionPreservation(() => context._actions.toggleTheme())
                };

                addEventListener(actionBar, 'click', (e) => {
                    const target = e.target.closest('button');
                    if (!target) return;

                    const handler = handlers[target.classList[1]];
                    if (handler) {
                        handler();
                    }
                });
            }

            // Улучшенные обработчики горячих клавиш с сохранением выделения
            addEventListener(context.shadowRoot, 'keydown', (e) => {
                // Обработка клавиши Enter
                if (e.key === 'Enter' && !e.shiftKey) {
                    // Сохраняем выделение перед переносом
                    saveSelection();

                    // Даем время Quill обработать перенос, затем корректируем курсор
                    setTimeout(() => {
                        if (context._correctCursorPosition) {
                            context._correctCursorPosition();
                        }
                        restoreSelection();
                    }, 50);
                }

                if (e.ctrlKey || e.metaKey) {
                    saveSelection();

                    console.log('dddddddddddddddddddddddddddddddddd')
                    switch (e.key) {
                        case 'b':
                            e.preventDefault();
                            context._actions.toggleFormat('bold');
                            setTimeout(restoreSelection, 0);
                            break;
                        case 'i':
                            e.preventDefault();
                            context._actions.toggleFormat('italic');
                            setTimeout(restoreSelection, 0);
                            break;
                        case 'u':
                            e.preventDefault();
                            context._actions.toggleFormat('underline');
                            setTimeout(restoreSelection, 0);
                            break;
                        case 'k':
                            e.preventDefault();
                            context._actions.insertLink();
                            setTimeout(restoreSelection, 0);
                            break;
                    }
                }
            });

            // Добавляем обработчик keyup для Enter
            addEventListener(context.shadowRoot, 'keyup', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    // Корректируем позицию курсора после завершения ввода
                    setTimeout(() => {
                        if (context._correctCursorPosition) {
                            context._correctCursorPosition();
                        }
                    }, 10);
                }
            });

            // Обновляем статистику после полной инициализации
            setTimeout(() => {
                if (context.quill && typeof context.quill.getText === 'function') {
                    context._updateContentStats();
                }
            }, 500);
        },

        async destroy() {
            eventListeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            eventListeners = [];
            currentSelection = null;
        },

        // Публичные методы для управления выделением
        getCurrentSelection() {
            return currentSelection;
        },

        saveCurrentSelection() {
            saveSelection();
        },

        restoreCurrentSelection() {
            restoreSelection();
        }
    };
};