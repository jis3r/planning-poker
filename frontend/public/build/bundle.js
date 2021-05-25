
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.35.0 */

    const { Error: Error_1, Object: Object_1$1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block$6(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block$6(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$6, create_else_block$6];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src\Navbar.svelte generated by Svelte v3.35.0 */
    const file$c = "src\\Navbar.svelte";

    // (56:24) {:else}
    function create_else_block$5(ctx) {
    	let img;
    	let img_src_value;
    	let img_intro;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "id", "themeIcon");
    			if (img.src !== (img_src_value = "img/moon.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "moon");
    			add_location(img, file$c, 56, 24, 2023);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		i: function intro(local) {
    			if (!img_intro) {
    				add_render_callback(() => {
    					img_intro = create_in_transition(img, fly, { y: 50, duration: 500 });
    					img_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(56:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (54:24) {#if darktheme}
    function create_if_block$5(ctx) {
    	let img;
    	let img_src_value;
    	let img_intro;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "id", "themeIcon");
    			if (img.src !== (img_src_value = "img/sun.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "sun");
    			add_location(img, file$c, 54, 24, 1880);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		i: function intro(local) {
    			if (!img_intro) {
    				add_render_callback(() => {
    					img_intro = create_in_transition(img, fly, { y: 50, duration: 500 });
    					img_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(54:24) {#if darktheme}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div8;
    	let div7;
    	let div6;
    	let div5;
    	let div0;
    	let h6;
    	let t0;
    	let div2;
    	let div1;
    	let h1;
    	let t2;
    	let div4;
    	let div3;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*darktheme*/ ctx[0]) return create_if_block$5;
    		return create_else_block$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			h6 = element("h6");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Planning Poker";
    			t2 = space();
    			div4 = element("div");
    			div3 = element("div");
    			if_block.c();
    			add_location(h6, file$c, 45, 53, 1353);
    			attr_dev(div0, "class", "one column theme-column");
    			add_location(div0, file$c, 45, 16, 1316);
    			attr_dev(h1, "class", "header-title");
    			add_location(h1, file$c, 48, 24, 1500);
    			add_location(div1, file$c, 47, 20, 1447);
    			attr_dev(div2, "class", "ten columns title-column");
    			add_location(div2, file$c, 46, 16, 1387);
    			attr_dev(div3, "id", "darkmodetrigger");
    			attr_dev(div3, "class", "darkmodetrigger u-pull-right");
    			add_location(div3, file$c, 52, 20, 1727);
    			attr_dev(div4, "class", "one column theme-column u-pull-right");
    			set_style(div4, "height", "100%");
    			set_style(div4, "margin-bottom", "0%");
    			add_location(div4, file$c, 51, 16, 1614);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$c, 44, 12, 1281);
    			attr_dev(div6, "class", "container");
    			add_location(div6, file$c, 43, 8, 1244);
    			attr_dev(div7, "id", "header");
    			attr_dev(div7, "class", "header");
    			add_location(div7, file$c, 42, 4, 1202);
    			attr_dev(div8, "class", "content");
    			add_location(div8, file$c, 41, 0, 1175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, h6);
    			append_dev(div5, t0);
    			append_dev(div5, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(div5, t2);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			if_block.m(div3, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*setLanding*/ ctx[1], false, false, false),
    					listen_dev(div3, "click", /*toggleTheme*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function changeThemeStyle(darktheme) {
    	let themeStyle = document.getElementById("themeStyle");

    	if (localStorage.getItem("theme") === undefined) {
    		localStorage.setItem("theme", "css/dark.css");
    	}

    	if (darktheme) {
    		themeStyle.setAttribute("href", "css/dark.css");
    		localStorage.setItem("theme", "css/dark.css");
    	} else {
    		themeStyle.setAttribute("href", "css/light.css");
    		localStorage.setItem("theme", "css/light.css");
    	}
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);
    	let darktheme = true;

    	const setLanding = e => {
    		e.preventDefault();
    		replace("/");
    	};

    	function toggleTheme() {
    		$$invalidate(0, darktheme = !darktheme);
    		changeThemeStyle(darktheme);
    	} //localStorage.removeItem('username');

    	onMount(() => {
    		if (localStorage.getItem("theme") === "css/light.css") {
    			$$invalidate(0, darktheme = false);
    			changeThemeStyle(darktheme);
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		fly,
    		replace,
    		darktheme,
    		setLanding,
    		toggleTheme,
    		changeThemeStyle
    	});

    	$$self.$inject_state = $$props => {
    		if ("darktheme" in $$props) $$invalidate(0, darktheme = $$props.darktheme);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [darktheme, setLanding, toggleTheme];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\routes\Landing.svelte generated by Svelte v3.35.0 */
    const file$b = "src\\routes\\Landing.svelte";

    function create_fragment$b(ctx) {
    	let div2;
    	let div0;
    	let h3;
    	let t1;
    	let span;
    	let t3;
    	let div1;
    	let button0;
    	let t5;
    	let button1;
    	let div2_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "A simple, online planning poker tool.";
    			t1 = space();
    			span = element("span");
    			span.textContent = "Just start a session or join an existing one to estimate your user stories.";
    			t3 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Start";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Join";
    			add_location(h3, file$b, 18, 8, 431);
    			set_style(span, "font-size", "15px");
    			add_location(span, file$b, 19, 8, 487);
    			attr_dev(div0, "class", "nine columns");
    			set_style(div0, "margin-bottom", "10%");
    			add_location(div0, file$b, 17, 4, 367);
    			attr_dev(button0, "class", "button-primary-start u-full-width");
    			add_location(button0, file$b, 22, 8, 703);
    			attr_dev(button1, "class", "button-primary-join u-full-width");
    			add_location(button1, file$b, 23, 8, 797);
    			attr_dev(div1, "class", "three columns indexbuttons");
    			set_style(div1, "margin-bottom", "10%");
    			add_location(div1, file$b, 21, 4, 625);
    			attr_dev(div2, "class", "row");
    			set_style(div2, "margin-top", "15%");
    			set_style(div2, "margin-bottom", "5%");
    			add_location(div2, file$b, 16, 0, 292);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t5);
    			append_dev(div1, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*setStart*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*setJoin*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!div2_intro) {
    				add_render_callback(() => {
    					div2_intro = create_in_transition(div2, fade, {});
    					div2_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Landing", slots, []);
    	const onload = null;

    	const setStart = () => {
    		push("/start");
    	};

    	const setJoin = () => {
    		push("/join");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Landing> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fade, push, onload, setStart, setJoin });
    	return [setStart, setJoin, onload];
    }

    class Landing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { onload: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Landing",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get onload() {
    		return this.$$.ctx[2];
    	}

    	set onload(value) {
    		throw new Error("<Landing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let userdata = {
        username: '', 
        roomID: '', 
        role: 'member'
    };

    function setUserdata(name, id, role='member') {
        userdata.username = name || 'user';
        userdata.roomID = id || '';
        userdata.role = role;

        localStorage.setItem('username', name);
        localStorage.setItem('role', role);
        socket.connect();
        socket.emit('joinRoom', userdata);
    }

    function validateUsername(username) {
        if( username.length > 2 && username.length < 13 ) return true;
        return false;
    }

    function validateRoomID(roomid) {
        if( roomid !== null && roomid.length === 5 && roomid.match(/^[0-9]+$/) !== null ) return true;
        return false;
    }

    function buttonPulse() {
        let btn = document.getElementById("submitButton");
        btn.classList.add("button-primary-negative");
        setTimeout(function(){
            btn.classList.remove("button-primary-negative");
        }, 300);
    }

    /* src\components\Checkbox_Spectator.svelte generated by Svelte v3.35.0 */
    const file$a = "src\\components\\Checkbox_Spectator.svelte";

    // (25:8) {:else}
    function create_else_block$4(ctx) {
    	let img;
    	let img_src_value;
    	let img_intro;

    	const block = {
    		c: function create() {
    			img = element("img");
    			set_style(img, "vertical-align", "middle");
    			if (img.src !== (img_src_value = "img/eye-off.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "unchecked");
    			add_location(img, file$a, 25, 8, 668);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		i: function intro(local) {
    			if (!img_intro) {
    				add_render_callback(() => {
    					img_intro = create_in_transition(img, fade, {});
    					img_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(25:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (23:8) {#if isSpectator}
    function create_if_block$4(ctx) {
    	let img;
    	let img_src_value;
    	let img_intro;

    	const block = {
    		c: function create() {
    			img = element("img");
    			set_style(img, "vertical-align", "middle");
    			if (img.src !== (img_src_value = "img/eye.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "checked");
    			add_location(img, file$a, 23, 8, 564);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		i: function intro(local) {
    			if (!img_intro) {
    				add_render_callback(() => {
    					img_intro = create_in_transition(img, fade, {});
    					img_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(23:8) {#if isSpectator}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let span;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*isSpectator*/ ctx[0]) return create_if_block$4;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if_block.c();
    			t0 = space();
    			span = element("span");
    			span.textContent = "Join as spectator";
    			attr_dev(div0, "class", "checkboxContainer");
    			add_location(div0, file$a, 21, 4, 496);
    			set_style(span, "padding-top", "1px");
    			set_style(span, "float", "left");
    			add_location(span, file$a, 28, 4, 784);
    			set_style(div1, "cursor", "pointer");
    			add_location(div1, file$a, 20, 0, 433);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if_block.m(div0, null);
    			append_dev(div1, t0);
    			append_dev(div1, span);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*toggleSpectator*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Checkbox_Spectator", slots, []);
    	let { isSpectator = false } = $$props;
    	const dispatch = createEventDispatcher();

    	onMount(() => {
    		toggleSpectator();
    		toggleSpectator();
    	});

    	const toggleSpectator = () => {
    		$$invalidate(0, isSpectator = !isSpectator);
    		dispatch("setRole", isSpectator);
    	};

    	const writable_props = ["isSpectator"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Checkbox_Spectator> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("isSpectator" in $$props) $$invalidate(0, isSpectator = $$props.isSpectator);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		fade,
    		isSpectator,
    		dispatch,
    		toggleSpectator
    	});

    	$$self.$inject_state = $$props => {
    		if ("isSpectator" in $$props) $$invalidate(0, isSpectator = $$props.isSpectator);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isSpectator, toggleSpectator];
    }

    class Checkbox_Spectator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { isSpectator: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Checkbox_Spectator",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get isSpectator() {
    		throw new Error("<Checkbox_Spectator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isSpectator(value) {
    		throw new Error("<Checkbox_Spectator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\routes\Start.svelte generated by Svelte v3.35.0 */
    const file$9 = "src\\routes\\Start.svelte";

    function create_fragment$9(ctx) {
    	let div2;
    	let div0;
    	let input0;
    	let t0;
    	let label;
    	let t2;
    	let input1;
    	let t3;
    	let div1;
    	let button;
    	let t5;
    	let checkbox_spectator;
    	let div2_intro;
    	let current;
    	let mounted;
    	let dispose;

    	checkbox_spectator = new Checkbox_Spectator({
    			props: { isSpectator: /*isSpectator*/ ctx[2] },
    			$$inline: true
    		});

    	checkbox_spectator.$on("setRole", /*setRole*/ ctx[3]);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			label = element("label");
    			label.textContent = "Please enter your username.";
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "submit";
    			t5 = space();
    			create_component(checkbox_spectator.$$.fragment);
    			attr_dev(input0, "class", "u-full-width");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Username");
    			attr_dev(input0, "name", "username");
    			attr_dev(input0, "id", "usernameInput");
    			attr_dev(input0, "minlength", "3");
    			attr_dev(input0, "maxlength", "12");
    			attr_dev(input0, "autocomplete", "off");
    			input0.required = true;
    			add_location(input0, file$9, 38, 8, 1194);
    			attr_dev(label, "id", "usernameLabel");
    			attr_dev(label, "for", "usernameInput");
    			add_location(label, file$9, 39, 8, 1381);
    			attr_dev(input1, "type", "hidden");
    			attr_dev(input1, "name", "room");
    			attr_dev(input1, "id", "roomIDInput");
    			add_location(input1, file$9, 40, 8, 1472);
    			attr_dev(div0, "class", "nine columns");
    			add_location(div0, file$9, 37, 4, 1158);
    			attr_dev(button, "class", "button-primary button-submit u-full-width");
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "id", "submitButton");
    			set_style(button, "transition", "500ms");
    			add_location(button, file$9, 43, 8, 1597);
    			attr_dev(div1, "class", "three columns");
    			add_location(div1, file$9, 42, 4, 1560);
    			attr_dev(div2, "class", "row");
    			set_style(div2, "margin-top", "15%");
    			add_location(div2, file$9, 36, 0, 1102);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*username*/ ctx[0]);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(div0, t2);
    			append_dev(div0, input1);
    			set_input_value(input1, /*roomID*/ ctx[1]);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			append_dev(div1, t5);
    			mount_component(checkbox_spectator, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(button, "click", /*submit*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				set_input_value(input0, /*username*/ ctx[0]);
    			}

    			if (dirty & /*roomID*/ 2) {
    				set_input_value(input1, /*roomID*/ ctx[1]);
    			}

    			const checkbox_spectator_changes = {};
    			if (dirty & /*isSpectator*/ 4) checkbox_spectator_changes.isSpectator = /*isSpectator*/ ctx[2];
    			checkbox_spectator.$set(checkbox_spectator_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox_spectator.$$.fragment, local);

    			if (!div2_intro) {
    				add_render_callback(() => {
    					div2_intro = create_in_transition(div2, fade, {});
    					div2_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox_spectator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(checkbox_spectator);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Start", slots, []);
    	let username = localStorage.getItem("username") || "";
    	let roomID = "";
    	let role = localStorage.getItem("role") || "member";
    	let isSpectator = false;

    	onMount(() => {
    		if (username) document.getElementById("submitButton").focus();
    		if (role === "spectator") $$invalidate(2, isSpectator = true);
    	});

    	const setRole = e => {
    		if (e.detail) role = "spectator";
    		if (!e.detail) role = "member";
    		localStorage.setItem("role", role);
    	};

    	const submit = () => {
    		if (validateUsername(username) && validateRoomID("00000")) {
    			setUserdata(username, roomID, role);
    		} else {
    			buttonPulse();
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Start> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(0, username);
    	}

    	function input1_input_handler() {
    		roomID = this.value;
    		$$invalidate(1, roomID);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		fade,
    		setUserdata,
    		validateUsername,
    		validateRoomID,
    		buttonPulse,
    		Checkbox_Spectator,
    		username,
    		roomID,
    		role,
    		isSpectator,
    		setRole,
    		submit
    	});

    	$$self.$inject_state = $$props => {
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("roomID" in $$props) $$invalidate(1, roomID = $$props.roomID);
    		if ("role" in $$props) role = $$props.role;
    		if ("isSpectator" in $$props) $$invalidate(2, isSpectator = $$props.isSpectator);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		roomID,
    		isSpectator,
    		setRole,
    		submit,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Start extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Start",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\routes\Join.svelte generated by Svelte v3.35.0 */
    const file$8 = "src\\routes\\Join.svelte";

    // (51:4) {:else}
    function create_else_block$3(ctx) {
    	let div0;
    	let input0;
    	let t0;
    	let label0;
    	let t2;
    	let div1;
    	let input1;
    	let t3;
    	let label1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			label0 = element("label");
    			label0.textContent = "Please enter your username.";
    			t2 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t3 = space();
    			label1 = element("label");
    			label1.textContent = "Please enter the room-id.";
    			attr_dev(input0, "class", "u-full-width");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Username");
    			attr_dev(input0, "name", "username");
    			attr_dev(input0, "id", "usernameInput");
    			attr_dev(input0, "minlength", "3");
    			attr_dev(input0, "maxlength", "12");
    			attr_dev(input0, "autocomplete", "off");
    			input0.required = true;
    			add_location(input0, file$8, 52, 12, 1810);
    			attr_dev(label0, "id", "usernameLabel");
    			attr_dev(label0, "for", "usernameInput");
    			add_location(label0, file$8, 53, 12, 2001);
    			attr_dev(div0, "class", "five columns");
    			add_location(div0, file$8, 51, 8, 1770);
    			attr_dev(input1, "class", "u-full-width");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "12345");
    			attr_dev(input1, "name", "room");
    			attr_dev(input1, "id", "roomIDInput");
    			attr_dev(input1, "minlength", "5");
    			attr_dev(input1, "maxlength", "5");
    			attr_dev(input1, "autocomplete", "off");
    			input1.required = true;
    			add_location(input1, file$8, 56, 12, 2148);
    			attr_dev(label1, "id", "roomidLabel");
    			attr_dev(label1, "for", "roomIdInput");
    			add_location(label1, file$8, 57, 12, 2327);
    			attr_dev(div1, "class", "four columns");
    			add_location(div1, file$8, 55, 8, 2108);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, input0);
    			set_input_value(input0, /*username*/ ctx[0]);
    			append_dev(div0, t0);
    			append_dev(div0, label0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input1);
    			set_input_value(input1, /*roomID*/ ctx[1]);
    			append_dev(div1, t3);
    			append_dev(div1, label1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[9]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				set_input_value(input0, /*username*/ ctx[0]);
    			}

    			if (dirty & /*roomID*/ 2 && input1.value !== /*roomID*/ ctx[1]) {
    				set_input_value(input1, /*roomID*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(51:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (45:4) {#if hasID}
    function create_if_block$3(ctx) {
    	let div;
    	let input0;
    	let t0;
    	let label;
    	let t2;
    	let input1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input0 = element("input");
    			t0 = space();
    			label = element("label");
    			label.textContent = "Please enter your username.";
    			t2 = space();
    			input1 = element("input");
    			attr_dev(input0, "class", "u-full-width");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Username");
    			attr_dev(input0, "name", "username");
    			attr_dev(input0, "id", "usernameInput");
    			attr_dev(input0, "minlength", "3");
    			attr_dev(input0, "maxlength", "12");
    			attr_dev(input0, "autocomplete", "off");
    			input0.required = true;
    			add_location(input0, file$8, 46, 12, 1375);
    			attr_dev(label, "id", "usernameLabel");
    			attr_dev(label, "for", "usernameInput");
    			add_location(label, file$8, 47, 12, 1566);
    			attr_dev(input1, "type", "hidden");
    			attr_dev(input1, "name", "room");
    			attr_dev(input1, "id", "roomIDInput");
    			add_location(input1, file$8, 48, 12, 1661);
    			attr_dev(div, "class", "nine columns");
    			add_location(div, file$8, 45, 8, 1335);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			set_input_value(input0, /*username*/ ctx[0]);
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(div, t2);
    			append_dev(div, input1);
    			set_input_value(input1, /*roomID*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				set_input_value(input0, /*username*/ ctx[0]);
    			}

    			if (dirty & /*roomID*/ 2) {
    				set_input_value(input1, /*roomID*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(45:4) {#if hasID}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let button;
    	let t2;
    	let checkbox_spectator;
    	let div1_intro;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*hasID*/ ctx[3]) return create_if_block$3;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	checkbox_spectator = new Checkbox_Spectator({
    			props: { isSpectator: /*isSpectator*/ ctx[2] },
    			$$inline: true
    		});

    	checkbox_spectator.$on("setRole", /*setRole*/ ctx[4]);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if_block.c();
    			t0 = space();
    			div0 = element("div");
    			button = element("button");
    			button.textContent = "submit input";
    			t2 = space();
    			create_component(checkbox_spectator.$$.fragment);
    			attr_dev(button, "class", "button-primary button-submit u-full-width");
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "id", "submitButton");
    			set_style(button, "transition", "500ms");
    			add_location(button, file$8, 61, 8, 2472);
    			attr_dev(div0, "class", "three columns");
    			add_location(div0, file$8, 60, 4, 2435);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-top", "15%");
    			add_location(div1, file$8, 43, 0, 1258);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if_block.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(div0, t2);
    			mount_component(checkbox_spectator, div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*submit*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, t0);
    				}
    			}

    			const checkbox_spectator_changes = {};
    			if (dirty & /*isSpectator*/ 4) checkbox_spectator_changes.isSpectator = /*isSpectator*/ ctx[2];
    			checkbox_spectator.$set(checkbox_spectator_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox_spectator.$$.fragment, local);

    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, fade, {});
    					div1_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox_spectator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block.d();
    			destroy_component(checkbox_spectator);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Join", slots, []);
    	let { params = {} } = $$props;
    	let username = localStorage.getItem("username") || "";
    	let roomID = "";
    	let role = localStorage.getItem("role") || "member";
    	let isSpectator = false;
    	let hasID = false;

    	onMount(() => {
    		if (validateRoomID(params.id)) {
    			$$invalidate(3, hasID = true);
    			$$invalidate(1, roomID = params.id);
    			document.getElementById("submitButton").focus();
    		}

    		if (role === "spectator") $$invalidate(2, isSpectator = true);
    	});

    	const setRole = e => {
    		if (e.detail) role = "spectator";
    		if (!e.detail) role = "member";
    		localStorage.setItem("role", role);
    	};

    	const submit = () => {
    		if (validateUsername(username) && validateRoomID(roomID)) {
    			setUserdata(username, roomID, role);
    		} else {
    			buttonPulse();
    		}
    	};

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Join> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(0, username);
    	}

    	function input1_input_handler() {
    		roomID = this.value;
    		$$invalidate(1, roomID);
    	}

    	function input0_input_handler_1() {
    		username = this.value;
    		$$invalidate(0, username);
    	}

    	function input1_input_handler_1() {
    		roomID = this.value;
    		$$invalidate(1, roomID);
    	}

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		fade,
    		setUserdata,
    		validateUsername,
    		validateRoomID,
    		buttonPulse,
    		Checkbox_Spectator,
    		params,
    		username,
    		roomID,
    		role,
    		isSpectator,
    		hasID,
    		setRole,
    		submit
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("roomID" in $$props) $$invalidate(1, roomID = $$props.roomID);
    		if ("role" in $$props) role = $$props.role;
    		if ("isSpectator" in $$props) $$invalidate(2, isSpectator = $$props.isSpectator);
    		if ("hasID" in $$props) $$invalidate(3, hasID = $$props.hasID);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		roomID,
    		isSpectator,
    		hasID,
    		setRole,
    		submit,
    		params,
    		input0_input_handler,
    		input1_input_handler,
    		input0_input_handler_1,
    		input1_input_handler_1
    	];
    }

    class Join extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { params: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Join",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get params() {
    		throw new Error("<Join>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Join>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function copyToClipboard(content) {
        navigator.clipboard.writeText(content).then(function() {
            //console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
        console.error('Async: Could not copy text: ', err);
        });
    }

    /* src\components\Button_Estimation.svelte generated by Svelte v3.35.0 */
    const file$7 = "src\\components\\Button_Estimation.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text(/*value*/ ctx[0]);
    			attr_dev(button, "id", /*value*/ ctx[0]);
    			attr_dev(button, "class", "u-full-width");
    			attr_dev(button, "onclick", "this.blur();");
    			add_location(button, file$7, 22, 4, 617);
    			attr_dev(div, "class", "two columns");
    			add_location(div, file$7, 21, 0, 586);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*estimate*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) set_data_dev(t, /*value*/ ctx[0]);

    			if (dirty & /*value*/ 1) {
    				attr_dev(button, "id", /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function toggleButton(id) {
    	let el = document.getElementsByClassName("button-primary-positive");

    	if (el.length !== 0) {
    		el[0].classList.toggle("button-primary-positive");
    	}

    	el = document.getElementById(id);
    	el.classList.toggle("button-primary-positive");
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button_Estimation", slots, []);
    	let { value } = $$props;
    	const dispatch = createEventDispatcher();

    	const estimate = () => {
    		toggleButton(value);
    		dispatch("setEstimation", value);
    	};

    	const writable_props = ["value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button_Estimation> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		value,
    		dispatch,
    		estimate,
    		toggleButton
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, estimate];
    }

    class Button_Estimation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button_Estimation",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Button_Estimation> was created without expected prop 'value'");
    		}
    	}

    	get value() {
    		throw new Error("<Button_Estimation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Button_Estimation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Banner.svelte generated by Svelte v3.35.0 */
    const file$6 = "src\\components\\Banner.svelte";

    // (10:0) {:else}
    function create_else_block$2(ctx) {
    	let h4;
    	let t;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(/*msg*/ ctx[0]);
    			set_style(h4, "visibility", "hidden");
    			add_location(h4, file$6, 10, 4, 242);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*msg*/ 1) set_data_dev(t, /*msg*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(10:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:0) {#if transition}
    function create_if_block$2(ctx) {
    	let h4;
    	let t;
    	let h4_outro;
    	let current;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(/*msg*/ ctx[0]);
    			set_style(h4, "text-align", "center");
    			add_location(h4, file$6, 8, 4, 143);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*msg*/ 1) set_data_dev(t, /*msg*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (h4_outro) h4_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			h4_outro = create_out_transition(h4, fade, { delay: 2500, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			if (detaching && h4_outro) h4_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(8:0) {#if transition}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*transition*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Banner", slots, []);
    	let { msg } = $$props;
    	let { transition } = $$props;
    	const writable_props = ["msg", "transition"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Banner> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("msg" in $$props) $$invalidate(0, msg = $$props.msg);
    		if ("transition" in $$props) $$invalidate(1, transition = $$props.transition);
    	};

    	$$self.$capture_state = () => ({ fade, msg, transition });

    	$$self.$inject_state = $$props => {
    		if ("msg" in $$props) $$invalidate(0, msg = $$props.msg);
    		if ("transition" in $$props) $$invalidate(1, transition = $$props.transition);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [msg, transition];
    }

    class Banner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { msg: 0, transition: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Banner",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*msg*/ ctx[0] === undefined && !("msg" in props)) {
    			console.warn("<Banner> was created without expected prop 'msg'");
    		}

    		if (/*transition*/ ctx[1] === undefined && !("transition" in props)) {
    			console.warn("<Banner> was created without expected prop 'transition'");
    		}
    	}

    	get msg() {
    		throw new Error("<Banner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set msg(value) {
    		throw new Error("<Banner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transition() {
    		throw new Error("<Banner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transition(value) {
    		throw new Error("<Banner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Userdetails.svelte generated by Svelte v3.35.0 */

    const file$5 = "src\\components\\Userdetails.svelte";

    // (13:4) {:else}
    function create_else_block_1$1(ctx) {
    	let td;
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(/*name*/ ctx[0]);
    			attr_dev(td, "id", /*id*/ ctx[1]);
    			add_location(td, file$5, 13, 8, 266);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 1) set_data_dev(t, /*name*/ ctx[0]);

    			if (dirty & /*id*/ 2) {
    				attr_dev(td, "id", /*id*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(13:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (11:4) {#if id === socketid}
    function create_if_block_2$1(ctx) {
    	let td;
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(/*name*/ ctx[0]);
    			attr_dev(td, "id", /*id*/ ctx[1]);
    			set_style(td, "color", "#33C3F0");
    			add_location(td, file$5, 11, 8, 195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 1) set_data_dev(t, /*name*/ ctx[0]);

    			if (dirty & /*id*/ 2) {
    				attr_dev(td, "id", /*id*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(11:4) {#if id === socketid}",
    		ctx
    	});

    	return block;
    }

    // (16:4) {#if estimation !== 'spectator'}
    function create_if_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*isReady*/ ctx[3] && /*estimation*/ ctx[2] !== "") return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(16:4) {#if estimation !== 'spectator'}",
    		ctx
    	});

    	return block;
    }

    // (21:8) {:else}
    function create_else_block$1(ctx) {
    	let td;
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(/*estimation*/ ctx[2]);
    			attr_dev(td, "class", "estimation");
    			add_location(td, file$5, 21, 12, 559);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*estimation*/ 4) set_data_dev(t, /*estimation*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(21:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:8) {#if isReady && estimation !== ''}
    function create_if_block_1$1(ctx) {
    	let td;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			td = element("td");
    			img = element("img");
    			if (img.src !== (img_src_value = "/img/check.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "ready");
    			set_style(img, "vertical-align", "middle");
    			add_location(img, file$5, 18, 16, 439);
    			attr_dev(td, "class", "estimation");
    			add_location(td, file$5, 17, 12, 398);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, img);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(17:8) {#if isReady && estimation !== ''}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let tr;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*id*/ ctx[1] === /*socketid*/ ctx[4]) return create_if_block_2$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*estimation*/ ctx[2] !== "spectator" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			add_location(tr, file$5, 9, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			if_block0.m(tr, null);
    			append_dev(tr, t);
    			if (if_block1) if_block1.m(tr, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(tr, t);
    				}
    			}

    			if (/*estimation*/ ctx[2] !== "spectator") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(tr, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Userdetails", slots, []);
    	let { name } = $$props;
    	let { id } = $$props;
    	let { estimation } = $$props;
    	let { isReady = false } = $$props;
    	let { socketid } = $$props;
    	const writable_props = ["name", "id", "estimation", "isReady", "socketid"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Userdetails> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("estimation" in $$props) $$invalidate(2, estimation = $$props.estimation);
    		if ("isReady" in $$props) $$invalidate(3, isReady = $$props.isReady);
    		if ("socketid" in $$props) $$invalidate(4, socketid = $$props.socketid);
    	};

    	$$self.$capture_state = () => ({ name, id, estimation, isReady, socketid });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("estimation" in $$props) $$invalidate(2, estimation = $$props.estimation);
    		if ("isReady" in $$props) $$invalidate(3, isReady = $$props.isReady);
    		if ("socketid" in $$props) $$invalidate(4, socketid = $$props.socketid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, id, estimation, isReady, socketid];
    }

    class Userdetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			name: 0,
    			id: 1,
    			estimation: 2,
    			isReady: 3,
    			socketid: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Userdetails",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Userdetails> was created without expected prop 'name'");
    		}

    		if (/*id*/ ctx[1] === undefined && !("id" in props)) {
    			console.warn("<Userdetails> was created without expected prop 'id'");
    		}

    		if (/*estimation*/ ctx[2] === undefined && !("estimation" in props)) {
    			console.warn("<Userdetails> was created without expected prop 'estimation'");
    		}

    		if (/*socketid*/ ctx[4] === undefined && !("socketid" in props)) {
    			console.warn("<Userdetails> was created without expected prop 'socketid'");
    		}
    	}

    	get name() {
    		throw new Error("<Userdetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Userdetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Userdetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Userdetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get estimation() {
    		throw new Error("<Userdetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set estimation(value) {
    		throw new Error("<Userdetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isReady() {
    		throw new Error("<Userdetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isReady(value) {
    		throw new Error("<Userdetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get socketid() {
    		throw new Error("<Userdetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socketid(value) {
    		throw new Error("<Userdetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Modal_Leave.svelte generated by Svelte v3.35.0 */
    const file$4 = "src\\components\\Modal_Leave.svelte";

    function create_fragment$4(ctx) {
    	let div6;
    	let div5;
    	let div1;
    	let div0;
    	let t1;
    	let div4;
    	let div2;
    	let button0;
    	let t3;
    	let div3;
    	let button1;
    	let div6_transition;
    	let t5;
    	let div7;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Do you really want to leave the lobby?";
    			t1 = space();
    			div4 = element("div");
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "stay";
    			t3 = space();
    			div3 = element("div");
    			button1 = element("button");
    			button1.textContent = "leave";
    			t5 = space();
    			div7 = element("div");
    			attr_dev(div0, "class", "twelve columns");
    			set_style(div0, "margin-bottom", "15%");
    			set_style(div0, "margin-top", "10%");
    			set_style(div0, "text-align", "center");
    			add_location(div0, file$4, 22, 12, 568);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$4, 21, 8, 537);
    			attr_dev(button0, "class", "button-primary-join u-full-width");
    			attr_dev(button0, "onclick", "this.blur();");
    			add_location(button0, file$4, 26, 16, 832);
    			attr_dev(div2, "class", "six columns");
    			add_location(div2, file$4, 25, 12, 789);
    			attr_dev(button1, "class", "button-primary-negative u-full-width");
    			attr_dev(button1, "onclick", "this.blur();");
    			add_location(button1, file$4, 29, 16, 1010);
    			attr_dev(div3, "class", "six columns");
    			add_location(div3, file$4, 28, 12, 967);
    			attr_dev(div4, "class", "row");
    			set_style(div4, "margin-bottom", "10%");
    			add_location(div4, file$4, 24, 8, 730);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$4, 20, 4, 504);
    			attr_dev(div6, "class", "modal");
    			attr_dev(div6, "id", "modal");
    			add_location(div6, file$4, 19, 0, 424);
    			attr_dev(div7, "class", "underlay");
    			add_location(div7, file$4, 34, 0, 1175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div1, div0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, button0);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, button1);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div7, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "click", /*close*/ ctx[2], false, false, false),
    					listen_dev(button0, "click", /*stay*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*leave*/ ctx[1], false, false, false),
    					listen_dev(div6, "click", stop_propagation(/*click_handler*/ ctx[3]), false, false, true)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div6_transition) div6_transition = create_bidirectional_transition(div6, fade, {}, true);
    				div6_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div6_transition) div6_transition = create_bidirectional_transition(div6, fade, {}, false);
    			div6_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (detaching && div6_transition) div6_transition.end();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div7);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal_Leave", slots, []);
    	const dispatch = createEventDispatcher();
    	let clicked = false;

    	const stay = () => {
    		dispatch("leave", false);
    	};

    	const leave = () => {
    		dispatch("leave", true);
    	};

    	const close = () => {
    		if (clicked) stay();
    		clicked = true;
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal_Leave> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fade,
    		dispatch,
    		clicked,
    		stay,
    		leave,
    		close
    	});

    	$$self.$inject_state = $$props => {
    		if ("clicked" in $$props) clicked = $$props.clicked;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [stay, leave, close, click_handler];
    }

    class Modal_Leave extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal_Leave",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\RoomID.svelte generated by Svelte v3.35.0 */
    const file$3 = "src\\components\\RoomID.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let h4;
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let div0;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h4 = element("h4");
    			t0 = text("room-id: \r\n        ");
    			span = element("span");
    			t1 = text(/*id*/ ctx[0]);
    			t2 = space();
    			div0 = element("div");
    			img = element("img");
    			attr_dev(span, "id", "roomID");
    			attr_dev(span, "class", "readycolor");
    			add_location(span, file$3, 15, 8, 305);
    			attr_dev(h4, "class", "u-pull-left");
    			set_style(h4, "vertical-align", "middle");
    			add_location(h4, file$3, 13, 4, 220);
    			if (img.src !== (img_src_value = "/img/copy.svg")) attr_dev(img, "src", img_src_value);
    			set_style(img, "cursor", "pointer");
    			set_style(img, "vertical-align", "middle");
    			attr_dev(img, "alt", "share");
    			add_location(img, file$3, 18, 8, 438);
    			attr_dev(div0, "class", "u-pull-left copyicon");
    			add_location(div0, file$3, 17, 4, 394);
    			add_location(div1, file$3, 12, 0, 209);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h4);
    			append_dev(h4, t0);
    			append_dev(h4, span);
    			append_dev(span, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, img);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*copy*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 1) set_data_dev(t1, /*id*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("RoomID", slots, []);
    	let { id } = $$props;
    	const dispatch = createEventDispatcher();

    	const copy = () => {
    		dispatch("copy");
    	};

    	const writable_props = ["id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RoomID> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		id,
    		dispatch,
    		copy
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, copy];
    }

    class RoomID extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { id: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RoomID",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
    			console.warn("<RoomID> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<RoomID>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<RoomID>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\routes\Lobby.svelte generated by Svelte v3.35.0 */

    const { Object: Object_1 } = globals;
    const file$2 = "src\\routes\\Lobby.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	return child_ctx;
    }

    // (178:12) {:else}
    function create_else_block_2(ctx) {
    	let banner;
    	let current;

    	banner = new Banner({
    			props: { msg: " ", transition: false },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(banner.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(banner, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(banner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(banner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(banner, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(178:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (176:12) {#if bannerIsVisible}
    function create_if_block_4(ctx) {
    	let banner;
    	let current;

    	banner = new Banner({
    			props: {
    				msg: /*bannermessage*/ ctx[1],
    				transition: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(banner.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(banner, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const banner_changes = {};
    			if (dirty[0] & /*bannermessage*/ 2) banner_changes.msg = /*bannermessage*/ ctx[1];
    			banner.$set(banner_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(banner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(banner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(banner, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(176:12) {#if bannerIsVisible}",
    		ctx
    	});

    	return block;
    }

    // (197:12) {:else}
    function create_else_block_1(ctx) {
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let tbody;
    	let t4;
    	let tr1;
    	let td0;
    	let t6;
    	let td1;
    	let t7;
    	let current;
    	let each_value_3 = /*members*/ ctx[3];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Members";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Estimation";
    			t3 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Average";
    			t6 = space();
    			td1 = element("td");
    			t7 = text(/*average*/ ctx[5]);
    			add_location(th0, file$2, 200, 28, 6141);
    			add_location(th1, file$2, 201, 28, 6187);
    			add_location(tr0, file$2, 199, 24, 6107);
    			add_location(thead, file$2, 198, 20, 6074);
    			add_location(td0, file$2, 213, 28, 6742);
    			attr_dev(td1, "id", "AuMgIVUHfSHpDpgMAAAB");
    			set_style(td1, "color", "#FCA311");
    			add_location(td1, file$2, 214, 28, 6788);
    			add_location(tr1, file$2, 212, 24, 6708);
    			attr_dev(tbody, "id", "playerlist");
    			add_location(tbody, file$2, 204, 20, 6289);
    			attr_dev(table, "class", "u-full-width");
    			add_location(table, file$2, 197, 16, 6024);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t1);
    			append_dev(tr0, th1);
    			append_dev(table, t3);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append_dev(tbody, t4);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t6);
    			append_dev(tr1, td1);
    			append_dev(td1, t7);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*members, preReveal*/ 136) {
    				each_value_3 = /*members*/ ctx[3];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, t4);
    					}
    				}

    				group_outros();

    				for (i = each_value_3.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty[0] & /*average*/ 32) set_data_dev(t7, /*average*/ ctx[5]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(197:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (195:12) {#if members.length === 0}
    function create_if_block_3(ctx) {
    	let h4;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			add_location(h4, file$2, 195, 16, 5975);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(195:12) {#if members.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (206:24) {#each members as member}
    function create_each_block_3(ctx) {
    	let userdetails;
    	let current;

    	userdetails = new Userdetails({
    			props: {
    				name: /*member*/ ctx[32].username,
    				id: /*member*/ ctx[32].id,
    				estimation: /*member*/ ctx[32].estimation,
    				isReady: /*preReveal*/ ctx[7],
    				socketid: socket.id
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(userdetails.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(userdetails, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const userdetails_changes = {};
    			if (dirty[0] & /*members*/ 8) userdetails_changes.name = /*member*/ ctx[32].username;
    			if (dirty[0] & /*members*/ 8) userdetails_changes.id = /*member*/ ctx[32].id;
    			if (dirty[0] & /*members*/ 8) userdetails_changes.estimation = /*member*/ ctx[32].estimation;
    			if (dirty[0] & /*preReveal*/ 128) userdetails_changes.isReady = /*preReveal*/ ctx[7];
    			userdetails.$set(userdetails_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(userdetails.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(userdetails.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(userdetails, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(206:24) {#each members as member}",
    		ctx
    	});

    	return block;
    }

    // (227:12) {:else}
    function create_else_block(ctx) {
    	let table;
    	let thead;
    	let tr;
    	let th;
    	let t1;
    	let tbody;
    	let current;
    	let each_value_2 = /*spectators*/ ctx[4];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th = element("th");
    			th.textContent = "Spectators";
    			t1 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(th, file$2, 230, 28, 7314);
    			add_location(tr, file$2, 229, 24, 7280);
    			add_location(thead, file$2, 228, 20, 7247);
    			attr_dev(tbody, "id", "spectatorlist");
    			add_location(tbody, file$2, 233, 20, 7416);
    			attr_dev(table, "class", "u-full-width");
    			add_location(table, file$2, 227, 16, 7197);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th);
    			append_dev(table, t1);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*spectators*/ 16) {
    				each_value_2 = /*spectators*/ ctx[4];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(227:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (225:12) {#if spectators.length === 0}
    function create_if_block_2(ctx) {
    	let h4;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			add_location(h4, file$2, 225, 16, 7148);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(225:12) {#if spectators.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (235:24) {#each spectators as spectator}
    function create_each_block_2(ctx) {
    	let userdetails;
    	let current;

    	userdetails = new Userdetails({
    			props: {
    				name: /*spectator*/ ctx[29].username,
    				id: /*spectator*/ ctx[29].id,
    				estimation: "spectator",
    				socketid: socket.id
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(userdetails.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(userdetails, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const userdetails_changes = {};
    			if (dirty[0] & /*spectators*/ 16) userdetails_changes.name = /*spectator*/ ctx[29].username;
    			if (dirty[0] & /*spectators*/ 16) userdetails_changes.id = /*spectator*/ ctx[29].id;
    			userdetails.$set(userdetails_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(userdetails.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(userdetails.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(userdetails, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(235:24) {#each spectators as spectator}",
    		ctx
    	});

    	return block;
    }

    // (247:4) {#if userdata.role === 'member'}
    function create_if_block_1(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let current;
    	let each_value_1 = /*firstRowValues*/ ctx[8];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*secondRowValues*/ ctx[9];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "row");
    			set_style(div0, "margin-top", "5%");
    			add_location(div0, file$2, 247, 8, 7918);
    			attr_dev(div1, "class", "row lowerrow");
    			add_location(div1, file$2, 252, 8, 8150);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*firstRowValues, setEstimation*/ 8448) {
    				each_value_1 = /*firstRowValues*/ ctx[8];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty[0] & /*secondRowValues, setEstimation*/ 8704) {
    				each_value = /*secondRowValues*/ ctx[9];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(247:4) {#if userdata.role === 'member'}",
    		ctx
    	});

    	return block;
    }

    // (249:12) {#each firstRowValues as currentValue}
    function create_each_block_1(ctx) {
    	let button_estimation;
    	let current;

    	button_estimation = new Button_Estimation({
    			props: { value: /*currentValue*/ ctx[24] },
    			$$inline: true
    		});

    	button_estimation.$on("setEstimation", /*setEstimation*/ ctx[13]);

    	const block = {
    		c: function create() {
    			create_component(button_estimation.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button_estimation, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button_estimation.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button_estimation.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button_estimation, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(249:12) {#each firstRowValues as currentValue}",
    		ctx
    	});

    	return block;
    }

    // (254:12) {#each secondRowValues as currentValue}
    function create_each_block(ctx) {
    	let button_estimation;
    	let current;

    	button_estimation = new Button_Estimation({
    			props: { value: /*currentValue*/ ctx[24] },
    			$$inline: true
    		});

    	button_estimation.$on("setEstimation", /*setEstimation*/ ctx[13]);

    	const block = {
    		c: function create() {
    			create_component(button_estimation.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button_estimation, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button_estimation.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button_estimation.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button_estimation, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(254:12) {#each secondRowValues as currentValue}",
    		ctx
    	});

    	return block;
    }

    // (262:0) {#if modal}
    function create_if_block(ctx) {
    	let modal_leave;
    	let current;
    	modal_leave = new Modal_Leave({ $$inline: true });
    	modal_leave.$on("leave", /*leaveLobby*/ ctx[11]);

    	const block = {
    		c: function create() {
    			create_component(modal_leave.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal_leave, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal_leave.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal_leave.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal_leave, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(262:0) {#if modal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div9;
    	let div4;
    	let div0;
    	let roomid;
    	let t0;
    	let div1;
    	let current_block_type_index;
    	let if_block0;
    	let t1;
    	let div2;
    	let button0;
    	let t3;
    	let div3;
    	let button1;
    	let t5;
    	let div8;
    	let div5;
    	let current_block_type_index_1;
    	let if_block1;
    	let t6;
    	let div6;
    	let h4;
    	let t7;
    	let div7;
    	let current_block_type_index_2;
    	let if_block2;
    	let t8;
    	let div9_intro;
    	let t9;
    	let if_block4_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	roomid = new RoomID({
    			props: { id: /*id*/ ctx[0] || "00000" },
    			$$inline: true
    		});

    	roomid.$on("copy", /*copyRoomID*/ ctx[14]);
    	const if_block_creators = [create_if_block_4, create_else_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*bannerIsVisible*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block_3, create_else_block_1];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*members*/ ctx[3].length === 0) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	const if_block_creators_2 = [create_if_block_2, create_else_block];
    	const if_blocks_2 = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*spectators*/ ctx[4].length === 0) return 0;
    		return 1;
    	}

    	current_block_type_index_2 = select_block_type_2(ctx);
    	if_block2 = if_blocks_2[current_block_type_index_2] = if_block_creators_2[current_block_type_index_2](ctx);
    	let if_block3 = userdata.role === "member" && create_if_block_1(ctx);
    	let if_block4 = /*modal*/ ctx[6] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			create_component(roomid.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			if_block0.c();
    			t1 = space();
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "reset";
    			t3 = space();
    			div3 = element("div");
    			button1 = element("button");
    			button1.textContent = "leave";
    			t5 = space();
    			div8 = element("div");
    			div5 = element("div");
    			if_block1.c();
    			t6 = space();
    			div6 = element("div");
    			h4 = element("h4");
    			t7 = space();
    			div7 = element("div");
    			if_block2.c();
    			t8 = space();
    			if (if_block3) if_block3.c();
    			t9 = space();
    			if (if_block4) if_block4.c();
    			if_block4_anchor = empty();
    			attr_dev(div0, "class", "four columns");
    			add_location(div0, file$2, 171, 8, 4971);
    			attr_dev(div1, "class", "four columns");
    			attr_dev(div1, "id", "bannerfield");
    			add_location(div1, file$2, 174, 8, 5086);
    			attr_dev(button0, "class", "button-primary-join u-full-width");
    			set_style(button0, "display", "grid");
    			set_style(button0, "place-items", "center");
    			attr_dev(button0, "onclick", "this.blur();");
    			add_location(button0, file$2, 182, 12, 5382);
    			attr_dev(div2, "class", "two columns");
    			add_location(div2, file$2, 181, 8, 5343);
    			attr_dev(button1, "class", "button-primary-negative u-full-width");
    			add_location(button1, file$2, 188, 12, 5716);
    			attr_dev(div3, "class", "two columns");
    			add_location(div3, file$2, 187, 8, 5677);
    			attr_dev(div4, "class", "row");
    			set_style(div4, "margin-top", "15%");
    			add_location(div4, file$2, 170, 4, 4919);
    			attr_dev(div5, "class", "four columns");
    			add_location(div5, file$2, 193, 8, 5891);
    			add_location(h4, file$2, 221, 12, 7026);
    			attr_dev(div6, "class", "six columns");
    			add_location(div6, file$2, 220, 8, 6987);
    			attr_dev(div7, "class", "two columns");
    			add_location(div7, file$2, 223, 8, 7062);
    			attr_dev(div8, "class", "row");
    			set_style(div8, "margin-top", "5%");
    			add_location(div8, file$2, 192, 4, 5840);
    			attr_dev(div9, "class", "content");
    			add_location(div9, file$2, 169, 0, 4884);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div4);
    			append_dev(div4, div0);
    			mount_component(roomid, div0, null);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, button0);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, button1);
    			append_dev(div9, t5);
    			append_dev(div9, div8);
    			append_dev(div8, div5);
    			if_blocks_1[current_block_type_index_1].m(div5, null);
    			append_dev(div8, t6);
    			append_dev(div8, div6);
    			append_dev(div6, h4);
    			append_dev(div8, t7);
    			append_dev(div8, div7);
    			if_blocks_2[current_block_type_index_2].m(div7, null);
    			append_dev(div9, t8);
    			if (if_block3) if_block3.m(div9, null);
    			insert_dev(target, t9, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, if_block4_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*resetValues*/ ctx[12], false, false, false),
    					listen_dev(button1, "click", /*openModal*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const roomid_changes = {};
    			if (dirty[0] & /*id*/ 1) roomid_changes.id = /*id*/ ctx[0] || "00000";
    			roomid.$set(roomid_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div1, null);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    					if_blocks_1[previous_block_index_1] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks_1[current_block_type_index_1];

    				if (!if_block1) {
    					if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div5, null);
    			}

    			let previous_block_index_2 = current_block_type_index_2;
    			current_block_type_index_2 = select_block_type_2(ctx);

    			if (current_block_type_index_2 === previous_block_index_2) {
    				if_blocks_2[current_block_type_index_2].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_2[previous_block_index_2], 1, 1, () => {
    					if_blocks_2[previous_block_index_2] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks_2[current_block_type_index_2];

    				if (!if_block2) {
    					if_block2 = if_blocks_2[current_block_type_index_2] = if_block_creators_2[current_block_type_index_2](ctx);
    					if_block2.c();
    				} else {
    					if_block2.p(ctx, dirty);
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(div7, null);
    			}

    			if (userdata.role === "member") if_block3.p(ctx, dirty);

    			if (/*modal*/ ctx[6]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*modal*/ 64) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(if_block4_anchor.parentNode, if_block4_anchor);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(roomid.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);

    			if (!div9_intro) {
    				add_render_callback(() => {
    					div9_intro = create_in_transition(div9, fade, {});
    					div9_intro.start();
    				});
    			}

    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(roomid.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			destroy_component(roomid);
    			if_blocks[current_block_type_index].d();
    			if_blocks_1[current_block_type_index_1].d();
    			if_blocks_2[current_block_type_index_2].d();
    			if (if_block3) if_block3.d();
    			if (detaching) detach_dev(t9);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(if_block4_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lobby", slots, []);
    	let { params = {} } = $$props;
    	let url = process.env.URL || "http://localhost:3000";
    	let id;
    	let firstRowValues = ["0", "1", "2", "3", "5", "8"];
    	let secondRowValues = ["13", "20", "40", "100", "?", "coffee"];
    	let bannermessage = "";
    	let bannerIsVisible = false;
    	let members = [];
    	let spectators = [];
    	let average = "";
    	let readyUsers = 0;
    	let modal = false;
    	let preReveal = true;

    	onMount(() => {
    		$$invalidate(0, id = params.id);

    		if (!socket.connected) {
    			localStorage.getItem("username");
    			localStorage.getItem("role");

    			//if( name ) setUserdata(name, id, role);
    			replace("/join/" + id);
    		}

    		socket.emit("ready");
    	});

    	onDestroy(() => {
    		socket.disconnect();
    	});

    	const openModal = () => {
    		$$invalidate(2, bannerIsVisible = false);
    		toggleModal();
    	};

    	const toggleModal = () => {
    		let blurr = document.getElementsByClassName("content");

    		for (let i = 0; i < blurr.length; i++) {
    			blurr[i].classList.toggle("is-blurred");
    		}

    		$$invalidate(6, modal = !modal);
    	};

    	const leaveLobby = e => {
    		toggleModal();

    		if (e.detail) {
    			setTimeout(
    				function () {
    					replace("/");
    				},
    				10
    			);
    		}
    	};

    	const resetValues = () => {
    		socket.emit("reset", "");
    	};

    	socket.on("resetReveal", function () {
    		$$invalidate(7, preReveal = true);
    		$$invalidate(5, average = "");
    	});

    	socket.on("bannermessage", message => {
    		newMessage(message);
    	});

    	// Get room and users
    	socket.on("roomUsers", ({ /*room,*/
    		users }) => {
    		$$invalidate(3, members = []);
    		$$invalidate(4, spectators = []);
    		$$invalidate(3, members = users.filter(user => user.role === "member"));
    		$$invalidate(4, spectators = users.filter(user => user.role === "spectator"));
    	});

    	function newMessage(msg) {
    		$$invalidate(1, bannermessage = msg);
    		$$invalidate(2, bannerIsVisible = true);

    		setTimeout(
    			function () {
    				$$invalidate(2, bannerIsVisible = false);
    			},
    			1
    		);
    	}

    	const setEstimation = e => {
    		let tempUser = members.find(user => user.id === socket.id);
    		let user = Object.assign({}, tempUser);

    		if (user.estimation !== e.detail) {
    			user.estimation = e.detail;
    			replaceUser(user);
    			socket.emit("estimated", e.detail);
    		}
    	};

    	// Recieve Estimation from another User
    	socket.on("newEstimation", user => {
    		replaceUser(user);
    	});

    	function replaceUser(user) {
    		let index = members.findIndex(u => u.id == user.id);

    		if (members[index].estimation === "") {
    			if (members.length - 1 !== readyUsers) user.isReady = true;
    			readyUsers++;
    		}

    		$$invalidate(3, members[index] = user, members);
    	}

    	socket.on("reveal", foo => {
    		averageCalc();
    		revealEstimations();
    	});

    	function revealEstimations() {
    		$$invalidate(7, preReveal = false);
    	}

    	function averageCalc() {
    		let sum = 0;
    		let count = 0;
    		$$invalidate(5, average = "");

    		for (let i = 0; i < members.length; i++) {
    			let estimation = members[i].estimation;

    			if (estimation !== "" && estimation !== "?" && estimation !== "coffee") {
    				sum = sum + parseInt(members[i].estimation);
    				count++;
    			}
    		}

    		if (count !== 0) {
    			sum = Math.round(sum / count * 100) / 100;
    			$$invalidate(5, average = sum.toString());
    		}
    	}

    	socket.on("emptyList", foo => {
    		clearList();
    	});

    	function clearList() {
    		for (let i = 0; i < members.length; i++) {
    			$$invalidate(3, members[i].estimation = "", members);
    		}

    		$$invalidate(7, preReveal = true);
    		let button = document.getElementsByClassName("button-primary-positive");

    		if (button[0] !== undefined) {
    			button[0].classList.remove("button-primary-positive");
    		}

    		$$invalidate(5, average = "");
    		readyUsers = 0;
    		newMessage("Estimations reseted.");
    	}

    	const copyRoomID = () => {
    		copyToClipboard(url + "/#/room/" + id);
    		newMessage("Invitation link copied.");
    	};

    	const writable_props = ["params"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lobby> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(15, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		fade,
    		replace,
    		userdata,
    		setUserdata,
    		copyToClipboard,
    		Button_Estimation,
    		Banner,
    		Userdetails,
    		Modal_Leave,
    		RoomID,
    		params,
    		url,
    		id,
    		firstRowValues,
    		secondRowValues,
    		bannermessage,
    		bannerIsVisible,
    		members,
    		spectators,
    		average,
    		readyUsers,
    		modal,
    		preReveal,
    		openModal,
    		toggleModal,
    		leaveLobby,
    		resetValues,
    		newMessage,
    		setEstimation,
    		replaceUser,
    		revealEstimations,
    		averageCalc,
    		clearList,
    		copyRoomID
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(15, params = $$props.params);
    		if ("url" in $$props) url = $$props.url;
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("firstRowValues" in $$props) $$invalidate(8, firstRowValues = $$props.firstRowValues);
    		if ("secondRowValues" in $$props) $$invalidate(9, secondRowValues = $$props.secondRowValues);
    		if ("bannermessage" in $$props) $$invalidate(1, bannermessage = $$props.bannermessage);
    		if ("bannerIsVisible" in $$props) $$invalidate(2, bannerIsVisible = $$props.bannerIsVisible);
    		if ("members" in $$props) $$invalidate(3, members = $$props.members);
    		if ("spectators" in $$props) $$invalidate(4, spectators = $$props.spectators);
    		if ("average" in $$props) $$invalidate(5, average = $$props.average);
    		if ("readyUsers" in $$props) readyUsers = $$props.readyUsers;
    		if ("modal" in $$props) $$invalidate(6, modal = $$props.modal);
    		if ("preReveal" in $$props) $$invalidate(7, preReveal = $$props.preReveal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		id,
    		bannermessage,
    		bannerIsVisible,
    		members,
    		spectators,
    		average,
    		modal,
    		preReveal,
    		firstRowValues,
    		secondRowValues,
    		openModal,
    		leaveLobby,
    		resetValues,
    		setEstimation,
    		copyRoomID,
    		params
    	];
    }

    class Lobby extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { params: 15 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lobby",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get params() {
    		throw new Error("<Lobby>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Lobby>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\routes\NotFound.svelte generated by Svelte v3.35.0 */
    const file$1 = "src\\routes\\NotFound.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let h3;
    	let t1;
    	let a;
    	let t3;
    	let span;
    	let div1_intro;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "404 not found.";
    			t1 = space();
    			a = element("a");
    			a.textContent = "Back to the main menu";
    			t3 = space();
    			span = element("span");
    			add_location(h3, file$1, 6, 8, 215);
    			attr_dev(a, "href", "https://planning-poker-test.herokuapp.com");
    			set_style(a, "font-size", "15px");
    			add_location(a, file$1, 7, 8, 248);
    			add_location(span, file$1, 8, 8, 359);
    			attr_dev(div0, "class", "twelve columns");
    			set_style(div0, "margin-bottom", "10%");
    			add_location(div0, file$1, 5, 4, 149);
    			attr_dev(div1, "class", "row");
    			set_style(div1, "margin-top", "15%");
    			set_style(div1, "margin-bottom", "5%");
    			add_location(div1, file$1, 4, 0, 74);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(div0, t1);
    			append_dev(div0, a);
    			append_dev(div0, t3);
    			append_dev(div0, span);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, fade, {});
    					div1_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NotFound", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fade });
    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var routes = {
        '/': Landing,
        '/start': Start,
        '/join/:id?': Join,
        '/room/:id': Lobby,
        '*': NotFound
    };

    /* src\App.svelte generated by Svelte v3.35.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let navbar;
    	let t;
    	let div;
    	let router;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	router = new Router({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(router.$$.fragment);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 15, 1, 294);
    			add_location(main, file, 13, 0, 273);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t);
    			append_dev(main, div);
    			mount_component(router, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	socket.on("newRoom", newRoom => {
    		push("/room/" + newRoom);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, push, Navbar, routes });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
