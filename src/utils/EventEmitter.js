export class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
        // Возвращаем функцию отписки для удобства
        return () => this.off(event, listener);
    }

    off(event, listenerToRemove) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listenerToRemove);
    }

    emit(event, payload) {
        if (!this.events[event]) return;
        // Копируем массив, чтобы отписки внутри обработчиков не ломали цикл
        [...this.events[event]].forEach(listener => listener(payload));
    }
    
    clear() {
        this.events = {};
    }
}
