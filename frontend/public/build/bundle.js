
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function (exports) {
    'use strict';

    function noop() { }
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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

    /* src\Navbar.svelte generated by Svelte v3.35.0 */
    const file$6 = "src\\Navbar.svelte";

    // (55:20) {:else}
    function create_else_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "id", "themeIcon");
    			if (img.src !== (img_src_value = "img/moon.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "moon");
    			attr_dev(img, "class", "svgmoon");
    			add_location(img, file$6, 55, 20, 1833);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(55:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (53:20) {#if darktheme}
    function create_if_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "id", "themeIcon");
    			if (img.src !== (img_src_value = "img/sun.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "sun");
    			attr_dev(img, "class", "svgsun");
    			add_location(img, file$6, 53, 20, 1719);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(53:20) {#if darktheme}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div8;
    	let div7;
    	let div6;
    	let div0;
    	let h60;
    	let t0;
    	let div2;
    	let div1;
    	let h2;
    	let t2;
    	let div3;
    	let h61;
    	let t3;
    	let div5;
    	let div4;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*darktheme*/ ctx[0]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			h60 = element("h6");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Planning Poker";
    			t2 = space();
    			div3 = element("div");
    			h61 = element("h6");
    			t3 = space();
    			div5 = element("div");
    			div4 = element("div");
    			if_block.c();
    			add_location(h60, file$6, 41, 39, 1180);
    			attr_dev(div0, "class", "three columns");
    			add_location(div0, file$6, 41, 12, 1153);
    			attr_dev(h2, "class", "header-title");
    			add_location(h2, file$6, 44, 20, 1302);
    			add_location(div1, file$6, 43, 16, 1253);
    			attr_dev(div2, "class", "six columns");
    			add_location(div2, file$6, 42, 12, 1210);
    			add_location(h61, file$6, 48, 16, 1447);
    			attr_dev(div3, "class", "two columns");
    			add_location(div3, file$6, 47, 12, 1404);
    			attr_dev(div4, "id", "darkmodetrigger");
    			attr_dev(div4, "class", "darkmodetrigger u-pull-right");
    			add_location(div4, file$6, 51, 16, 1574);
    			attr_dev(div5, "class", "one column");
    			set_style(div5, "height", "100%");
    			set_style(div5, "margin-bottom", "0%");
    			add_location(div5, file$6, 50, 12, 1491);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$6, 40, 8, 1122);
    			attr_dev(div7, "class", "container");
    			add_location(div7, file$6, 39, 4, 1089);
    			attr_dev(div8, "id", "header");
    			attr_dev(div8, "class", "header");
    			add_location(div8, file$6, 38, 0, 1051);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div0, h60);
    			append_dev(div6, t0);
    			append_dev(div6, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h2);
    			append_dev(div6, t2);
    			append_dev(div6, div3);
    			append_dev(div3, h61);
    			append_dev(div6, t3);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			if_block.m(div4, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*setLanding*/ ctx[1], false, false, false),
    					listen_dev(div4, "click", /*toggleTheme*/ ctx[2], false, false, false)
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
    					if_block.m(div4, null);
    				}
    			}
    		},
    		i: noop,
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);
    	const dispatch = createEventDispatcher();
    	let darktheme = true;

    	const setLanding = e => {
    		e.preventDefault();
    		dispatch("changepage", 0);
    	};

    	function toggleTheme() {
    		$$invalidate(0, darktheme = !darktheme);
    		changeThemeStyle();
    	}

    	function changeThemeStyle() {
    		let themeStyle = document.getElementById("themeStyle");

    		if (localStorage.getItem("theme") === undefined) {
    			localStorage.setItem("theme", "css/light.css");
    		}

    		if (darktheme) {
    			themeStyle.setAttribute("href", "css/dark.css");
    			localStorage.setItem("theme", "css/dark.css");
    		} else {
    			themeStyle.setAttribute("href", "css/light.css");
    			localStorage.setItem("theme", "css/light.css");
    		}
    	}

    	onMount(() => {
    		if (localStorage.getItem("theme") === "css/light.css") {
    			$$invalidate(0, darktheme = false);
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		dispatch,
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Landing.svelte generated by Svelte v3.35.0 */
    const file$5 = "src\\Landing.svelte";

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let t3;
    	let div1;
    	let button0;
    	let t5;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text("This is a simple, online planning poker tool.");
    			br0 = element("br");
    			t1 = text("\r\n        Just host a new sessions and invite your teammates to start estimating your user stories");
    			br1 = element("br");
    			t2 = text("\r\n        or join an existing session.");
    			t3 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Start new session";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Join a session";
    			add_location(br0, file$5, 26, 53, 617);
    			add_location(br1, file$5, 27, 96, 719);
    			attr_dev(div0, "class", "nine columns");
    			set_style(div0, "margin-bottom", "10%");
    			add_location(div0, file$5, 25, 4, 508);
    			attr_dev(button0, "class", "button-primary-start u-full-width");
    			add_location(button0, file$5, 31, 8, 857);
    			attr_dev(button1, "class", "button-primary-join u-full-width");
    			add_location(button1, file$5, 32, 8, 963);
    			attr_dev(div1, "class", "three columns indexbuttons");
    			set_style(div1, "margin-bottom", "10%");
    			add_location(div1, file$5, 30, 4, 779);
    			attr_dev(div2, "class", "row");
    			set_style(div2, "margin-top", "15%");
    			set_style(div2, "margin-bottom", "5%");
    			add_location(div2, file$5, 24, 0, 441);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div0, br0);
    			append_dev(div0, t1);
    			append_dev(div0, br1);
    			append_dev(div0, t2);
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
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("Landing", slots, []);
    	const onload = null;
    	const dispatch = createEventDispatcher();

    	const setStart = e => {
    		dispatch("changepage", 1);
    	};

    	const setJoin = e => {
    		dispatch("changepage", 2);
    	};

    	beforeUpdate(() => {
    		getTheme();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Landing> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		beforeUpdate,
    		getTheme,
    		onload,
    		dispatch,
    		setStart,
    		setJoin
    	});

    	return [setStart, setJoin, onload];
    }

    class Landing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { onload: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Landing",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get onload() {
    		return this.$$.ctx[2];
    	}

    	set onload(value) {
    		throw new Error("<Landing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Start.svelte generated by Svelte v3.35.0 */
    const file$4 = "src\\Start.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let form;
    	let div0;
    	let input0;
    	let t0;
    	let label;
    	let t2;
    	let input1;
    	let t3;
    	let div1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			form = element("form");
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
    			attr_dev(input0, "class", "u-full-width");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Username");
    			attr_dev(input0, "name", "username");
    			attr_dev(input0, "id", "usernameInput");
    			attr_dev(input0, "minlength", "3");
    			attr_dev(input0, "maxlength", "20");
    			input0.required = true;
    			add_location(input0, file$4, 24, 12, 591);
    			attr_dev(label, "for", "usernameInput");
    			add_location(label, file$4, 25, 12, 772);
    			attr_dev(input1, "type", "hidden");
    			attr_dev(input1, "name", "room");
    			attr_dev(input1, "id", "roomIDInput");
    			add_location(input1, file$4, 26, 12, 848);
    			attr_dev(div0, "class", "nine columns");
    			add_location(div0, file$4, 23, 8, 551);
    			attr_dev(button, "class", "button-primary button-submit u-full-width");
    			attr_dev(button, "type", "submit");
    			add_location(button, file$4, 29, 12, 994);
    			attr_dev(div1, "class", "three columns");
    			add_location(div1, file$4, 28, 8, 953);
    			attr_dev(form, "autocomplete", "off");
    			add_location(form, file$4, 22, 4, 495);
    			attr_dev(div2, "class", "row");
    			set_style(div2, "margin-top", "15%");
    			add_location(div2, file$4, 21, 0, 447);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, form);
    			append_dev(form, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*userdata*/ ctx[0].username);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(div0, t2);
    			append_dev(div0, input1);
    			set_input_value(input1, /*userdata*/ ctx[0].roomID);
    			append_dev(form, t3);
    			append_dev(form, div1);
    			append_dev(div1, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[2]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[3]),
    					listen_dev(form, "submit", /*setLobby*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*userdata*/ 1 && input0.value !== /*userdata*/ ctx[0].username) {
    				set_input_value(input0, /*userdata*/ ctx[0].username);
    			}

    			if (dirty & /*userdata*/ 1) {
    				set_input_value(input1, /*userdata*/ ctx[0].roomID);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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
    	validate_slots("Start", slots, []);
    	const dispatch = createEventDispatcher();
    	let userdata = { username: "", roomID: "" };

    	const setLobby = e => {
    		setUserdata(userdata.username, userdata.roomID);
    		dispatch("changepage", 3);
    		$$invalidate(0, userdata.username = "", userdata);
    		$$invalidate(0, userdata.roomID = "", userdata);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Start> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		userdata.username = this.value;
    		$$invalidate(0, userdata);
    	}

    	function input1_input_handler() {
    		userdata.roomID = this.value;
    		$$invalidate(0, userdata);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		setUserdata,
    		dispatch,
    		userdata,
    		setLobby
    	});

    	$$self.$inject_state = $$props => {
    		if ("userdata" in $$props) $$invalidate(0, userdata = $$props.userdata);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [userdata, setLobby, input0_input_handler, input1_input_handler];
    }

    class Start extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Start",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Join.svelte generated by Svelte v3.35.0 */
    const file$3 = "src\\Join.svelte";

    function create_fragment$3(ctx) {
    	let div3;
    	let form;
    	let div0;
    	let input0;
    	let t0;
    	let label0;
    	let t2;
    	let div1;
    	let input1;
    	let t3;
    	let label1;
    	let t5;
    	let div2;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			form = element("form");
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
    			t5 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "submit input";
    			attr_dev(input0, "class", "u-full-width");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Username");
    			attr_dev(input0, "name", "username");
    			attr_dev(input0, "id", "usernameInput");
    			attr_dev(input0, "minlength", "3");
    			attr_dev(input0, "maxlength", "20");
    			input0.required = true;
    			add_location(input0, file$3, 23, 12, 648);
    			attr_dev(label0, "for", "usernameInput");
    			add_location(label0, file$3, 24, 12, 829);
    			attr_dev(div0, "class", "five columns");
    			add_location(div0, file$3, 22, 8, 608);
    			attr_dev(input1, "class", "u-full-width");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "12345");
    			attr_dev(input1, "name", "room");
    			attr_dev(input1, "id", "roomIDInput");
    			attr_dev(input1, "minlength", "5");
    			attr_dev(input1, "maxlength", "5");
    			input1.required = true;
    			add_location(input1, file$3, 27, 12, 957);
    			attr_dev(label1, "for", "roomIdInput");
    			add_location(label1, file$3, 28, 12, 1126);
    			attr_dev(div1, "class", "four columns");
    			add_location(div1, file$3, 26, 8, 917);
    			attr_dev(button, "class", "button-primary button-submit u-full-width");
    			attr_dev(button, "type", "submit");
    			add_location(button, file$3, 31, 12, 1251);
    			attr_dev(div2, "class", "three columns");
    			add_location(div2, file$3, 30, 8, 1210);
    			attr_dev(form, "id", "form");
    			attr_dev(form, "autocomplete", "off");
    			add_location(form, file$3, 21, 4, 542);
    			attr_dev(div3, "class", "row");
    			set_style(div3, "margin-top", "15%");
    			add_location(div3, file$3, 20, 0, 494);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, form);
    			append_dev(form, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*userdata*/ ctx[0].username);
    			append_dev(div0, t0);
    			append_dev(div0, label0);
    			append_dev(form, t2);
    			append_dev(form, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*userdata*/ ctx[0].roomID);
    			append_dev(div1, t3);
    			append_dev(div1, label1);
    			append_dev(form, t5);
    			append_dev(form, div2);
    			append_dev(div2, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[2]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[3]),
    					listen_dev(form, "submit", /*validate*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*userdata*/ 1 && input0.value !== /*userdata*/ ctx[0].username) {
    				set_input_value(input0, /*userdata*/ ctx[0].username);
    			}

    			if (dirty & /*userdata*/ 1 && input1.value !== /*userdata*/ ctx[0].roomID) {
    				set_input_value(input1, /*userdata*/ ctx[0].roomID);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("Join", slots, []);
    	const dispatch = createEventDispatcher();
    	let userdata = { username: "", roomID: "" };

    	const validate = () => {
    		//checkRooms(userdata.roomID);
    		setUserdata(userdata.username, userdata.roomID);

    		dispatch("changepage", 3);
    		$$invalidate(0, userdata.username = "", userdata);
    		$$invalidate(0, userdata.roomID = "", userdata);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Join> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		userdata.username = this.value;
    		$$invalidate(0, userdata);
    	}

    	function input1_input_handler() {
    		userdata.roomID = this.value;
    		$$invalidate(0, userdata);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		setUserdata,
    		checkRooms,
    		dispatch,
    		userdata,
    		validate
    	});

    	$$self.$inject_state = $$props => {
    		if ("userdata" in $$props) $$invalidate(0, userdata = $$props.userdata);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [userdata, validate, input0_input_handler, input1_input_handler];
    }

    class Join extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Join",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Button_Estimation.svelte generated by Svelte v3.35.0 */
    const file$2 = "src\\Button_Estimation.svelte";

    function create_fragment$2(ctx) {
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
    			add_location(button, file$2, 12, 4, 266);
    			attr_dev(div, "class", "two columns");
    			add_location(div, file$2, 11, 0, 235);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button_Estimation", slots, []);
    	let { value } = $$props;

    	const estimate = () => {
    		toggleButton(value);
    		setEstimation(value);
    	};

    	const writable_props = ["value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button_Estimation> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({
    		toggleButton,
    		setEstimation,
    		value,
    		estimate
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button_Estimation",
    			options,
    			id: create_fragment$2.name
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

    /* src\Lobby.svelte generated by Svelte v3.35.0 */
    const file$1 = "src\\Lobby.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (77:4) {#each firstRowValues as currentValue}
    function create_each_block_1(ctx) {
    	let button_estimation;
    	let current;

    	button_estimation = new Button_Estimation({
    			props: { value: /*currentValue*/ ctx[8] },
    			$$inline: true
    		});

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
    		source: "(77:4) {#each firstRowValues as currentValue}",
    		ctx
    	});

    	return block;
    }

    // (82:4) {#each secondRowValues as currentValue}
    function create_each_block(ctx) {
    	let button_estimation;
    	let current;

    	button_estimation = new Button_Estimation({
    			props: { value: /*currentValue*/ ctx[8] },
    			$$inline: true
    		});

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
    		source: "(82:4) {#each secondRowValues as currentValue}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div5;
    	let div1;
    	let h40;
    	let t0;
    	let span;
    	let t2;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t3;
    	let div2;
    	let h41;
    	let t4;
    	let div3;
    	let button0;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let div4;
    	let button1;
    	let t7;
    	let div9;
    	let div6;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t9;
    	let th1;
    	let t11;
    	let tbody;
    	let t12;
    	let div7;
    	let h42;
    	let t13;
    	let div8;
    	let h43;
    	let t14;
    	let div10;
    	let t15;
    	let div11;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*firstRowValues*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*secondRowValues*/ ctx[2];
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
    			div5 = element("div");
    			div1 = element("div");
    			h40 = element("h4");
    			t0 = text("room-id: \r\n            ");
    			span = element("span");
    			span.textContent = "00000";
    			t2 = space();
    			div0 = element("div");
    			img0 = element("img");
    			t3 = space();
    			div2 = element("div");
    			h41 = element("h4");
    			t4 = space();
    			div3 = element("div");
    			button0 = element("button");
    			img1 = element("img");
    			t5 = space();
    			div4 = element("div");
    			button1 = element("button");
    			button1.textContent = "leave";
    			t7 = space();
    			div9 = element("div");
    			div6 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Members";
    			t9 = space();
    			th1 = element("th");
    			th1.textContent = "Estimation";
    			t11 = space();
    			tbody = element("tbody");
    			t12 = space();
    			div7 = element("div");
    			h42 = element("h4");
    			t13 = space();
    			div8 = element("div");
    			h43 = element("h4");
    			t14 = space();
    			div10 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t15 = space();
    			div11 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span, "id", "roomID");
    			attr_dev(span, "class", "readycolor");
    			add_location(span, file$1, 36, 12, 923);
    			attr_dev(h40, "class", "u-pull-left");
    			add_location(h40, file$1, 35, 8, 876);
    			if (img0.src !== (img0_src_value = "/img/copy.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "copy");
    			add_location(img0, file$1, 39, 12, 1088);
    			attr_dev(div0, "class", "copyicon u-pull-left");
    			add_location(div0, file$1, 38, 8, 1040);
    			attr_dev(div1, "class", "four columns");
    			add_location(div1, file$1, 34, 4, 840);
    			attr_dev(h41, "id", "newBanner");
    			set_style(h41, "text-align", "center");
    			set_style(h41, "transition-timing-function", "ease-in");
    			add_location(h41, file$1, 43, 8, 1233);
    			attr_dev(div2, "class", "four columns");
    			attr_dev(div2, "id", "bannerfield");
    			add_location(div2, file$1, 42, 4, 1180);
    			attr_dev(img1, "class", "reloadicon");
    			if (img1.src !== (img1_src_value = "/img/reload.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "reload");
    			add_location(img1, file$1, 47, 12, 1506);
    			attr_dev(button0, "class", "button-primary-join u-full-width");
    			set_style(button0, "display", "grid");
    			set_style(button0, "place-items", "center");
    			add_location(button0, file$1, 46, 8, 1376);
    			attr_dev(div3, "class", "two columns");
    			add_location(div3, file$1, 45, 4, 1341);
    			attr_dev(button1, "class", "button-primary-negative u-full-width");
    			add_location(button1, file$1, 51, 8, 1637);
    			attr_dev(div4, "class", "two columns");
    			add_location(div4, file$1, 50, 4, 1602);
    			attr_dev(div5, "class", "row");
    			set_style(div5, "margin-top", "15%");
    			add_location(div5, file$1, 33, 0, 792);
    			add_location(th0, file$1, 60, 20, 1926);
    			add_location(th1, file$1, 61, 20, 1964);
    			add_location(tr, file$1, 59, 16, 1900);
    			add_location(thead, file$1, 58, 12, 1875);
    			attr_dev(tbody, "id", "playerlist");
    			add_location(tbody, file$1, 64, 12, 2042);
    			attr_dev(table, "class", "u-full-width");
    			add_location(table, file$1, 57, 8, 1833);
    			attr_dev(div6, "class", "four columns");
    			add_location(div6, file$1, 56, 4, 1797);
    			add_location(h42, file$1, 68, 8, 2145);
    			attr_dev(div7, "class", "four columns");
    			add_location(div7, file$1, 67, 4, 2109);
    			add_location(h43, file$1, 71, 8, 2210);
    			attr_dev(div8, "class", "three columns");
    			add_location(div8, file$1, 70, 4, 2173);
    			attr_dev(div9, "class", "row");
    			set_style(div9, "margin-top", "5%");
    			add_location(div9, file$1, 55, 0, 1750);
    			attr_dev(div10, "class", "row");
    			set_style(div10, "margin-top", "5%");
    			add_location(div10, file$1, 75, 0, 2244);
    			attr_dev(div11, "class", "row lowerrow");
    			add_location(div11, file$1, 80, 0, 2399);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div1);
    			append_dev(div1, h40);
    			append_dev(h40, t0);
    			append_dev(h40, span);
    			/*span_binding*/ ctx[6](span);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, img0);
    			append_dev(div5, t3);
    			append_dev(div5, div2);
    			append_dev(div2, h41);
    			append_dev(div5, t4);
    			append_dev(div5, div3);
    			append_dev(div3, button0);
    			append_dev(button0, img1);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, button1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div6);
    			append_dev(div6, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t9);
    			append_dev(tr, th1);
    			append_dev(table, t11);
    			append_dev(table, tbody);
    			append_dev(div9, t12);
    			append_dev(div9, div7);
    			append_dev(div7, h42);
    			append_dev(div9, t13);
    			append_dev(div9, div8);
    			append_dev(div8, h43);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, div10, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div10, null);
    			}

    			insert_dev(target, t15, anchor);
    			insert_dev(target, div11, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div11, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(img0, "click", /*copyRoomID*/ ctx[5], false, false, false),
    					listen_dev(button0, "click", /*resetValues*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*leaveLobby*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*firstRowValues*/ 2) {
    				each_value_1 = /*firstRowValues*/ ctx[1];
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
    						each_blocks_1[i].m(div10, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*secondRowValues*/ 4) {
    				each_value = /*secondRowValues*/ ctx[2];
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
    						each_blocks[i].m(div11, null);
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
    			if (detaching) detach_dev(div5);
    			/*span_binding*/ ctx[6](null);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div9);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(div10);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div11);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("Lobby", slots, []);
    	const dispatch = createEventDispatcher();
    	let roomID;
    	let firstRowValues = ["0", "1", "2", "3", "5", "8"];
    	let secondRowValues = ["13", "20", "40", "100", "?", "coffee"];

    	const leaveLobby = () => {
    		leaveRoom();
    		dispatch("changepage", 0);
    	};

    	const resetValues = () => {
    		socket.emit("reset", "");
    	};

    	const copyRoomID = () => {
    		copyToClipboard(roomID.innerHTML);
    		showBannermessage("Copied.");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lobby> was created with unknown prop '${key}'`);
    	});

    	function span_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			roomID = $$value;
    			$$invalidate(0, roomID);
    		});
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		leaveRoom,
    		socket,
    		copyToClipboard,
    		showBannermessage,
    		Button_Estimation,
    		dispatch,
    		roomID,
    		firstRowValues,
    		secondRowValues,
    		leaveLobby,
    		resetValues,
    		copyRoomID
    	});

    	$$self.$inject_state = $$props => {
    		if ("roomID" in $$props) $$invalidate(0, roomID = $$props.roomID);
    		if ("firstRowValues" in $$props) $$invalidate(1, firstRowValues = $$props.firstRowValues);
    		if ("secondRowValues" in $$props) $$invalidate(2, secondRowValues = $$props.secondRowValues);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		roomID,
    		firstRowValues,
    		secondRowValues,
    		leaveLobby,
    		resetValues,
    		copyRoomID,
    		span_binding
    	];
    }

    class Lobby extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lobby",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.35.0 */
    const file = "src\\App.svelte";

    // (27:2) {:else}
    function create_else_block(ctx) {
    	let landing;
    	let current;
    	landing = new Landing({ $$inline: true });
    	landing.$on("changepage", /*setPage*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(landing.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(landing, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(landing.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(landing.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(landing, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(27:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:30) 
    function create_if_block_3(ctx) {
    	let lobby;
    	let current;
    	lobby = new Lobby({ $$inline: true });
    	lobby.$on("changepage", /*setPage*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(lobby.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(lobby, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lobby.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lobby.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lobby, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(25:30) ",
    		ctx
    	});

    	return block;
    }

    // (23:30) 
    function create_if_block_2(ctx) {
    	let join;
    	let current;
    	join = new Join({ $$inline: true });
    	join.$on("changepage", /*setPage*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(join.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(join, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(join.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(join.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(join, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(23:30) ",
    		ctx
    	});

    	return block;
    }

    // (21:30) 
    function create_if_block_1(ctx) {
    	let start;
    	let current;
    	start = new Start({ $$inline: true });
    	start.$on("changepage", /*setPage*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(start.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(start, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(start.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(start.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(start, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(21:30) ",
    		ctx
    	});

    	return block;
    }

    // (19:2) {#if currentPage === 0}
    function create_if_block(ctx) {
    	let landing;
    	let current;
    	landing = new Landing({ $$inline: true });
    	landing.$on("changepage", /*setPage*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(landing.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(landing, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(landing.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(landing.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(landing, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(19:2) {#if currentPage === 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let navbar;
    	let t;
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	navbar.$on("changepage", /*setPage*/ ctx[1]);

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_else_block
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentPage*/ ctx[0] === 0) return 0;
    		if (/*currentPage*/ ctx[0] === 1) return 1;
    		if (/*currentPage*/ ctx[0] === 2) return 2;
    		if (/*currentPage*/ ctx[0] === 3) return 3;
    		return 4;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t = space();
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "container");
    			add_location(div, file, 17, 1, 349);
    			add_location(main, file, 15, 0, 304);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t);
    			append_dev(main, div);
    			if_blocks[current_block_type_index].m(div, null);
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
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			if_blocks[current_block_type_index].d();
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
    	var currentPage = 0;

    	const setPage = e => {
    		$$invalidate(0, currentPage = e.detail);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Navbar,
    		Landing,
    		Start,
    		Join,
    		Lobby,
    		currentPage,
    		setPage
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentPage" in $$props) $$invalidate(0, currentPage = $$props.currentPage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentPage, setPage];
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

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*!
     * Socket.IO v4.0.0
     * (c) 2014-2021 Guillermo Rauch
     * Released under the MIT License.
     */

    var socket_io = createCommonjsModule(function (module, exports) {
    (function webpackUniversalModuleDefinition(root, factory) {
    	module.exports = factory();
    })(self, function() {
    return /******/ (function(modules) { // webpackBootstrap
    /******/ 	// The module cache
    /******/ 	var installedModules = {};
    /******/
    /******/ 	// The require function
    /******/ 	function __webpack_require__(moduleId) {
    /******/
    /******/ 		// Check if module is in cache
    /******/ 		if(installedModules[moduleId]) {
    /******/ 			return installedModules[moduleId].exports;
    /******/ 		}
    /******/ 		// Create a new module (and put it into the cache)
    /******/ 		var module = installedModules[moduleId] = {
    /******/ 			i: moduleId,
    /******/ 			l: false,
    /******/ 			exports: {}
    /******/ 		};
    /******/
    /******/ 		// Execute the module function
    /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/
    /******/ 		// Flag the module as loaded
    /******/ 		module.l = true;
    /******/
    /******/ 		// Return the exports of the module
    /******/ 		return module.exports;
    /******/ 	}
    /******/
    /******/
    /******/ 	// expose the modules object (__webpack_modules__)
    /******/ 	__webpack_require__.m = modules;
    /******/
    /******/ 	// expose the module cache
    /******/ 	__webpack_require__.c = installedModules;
    /******/
    /******/ 	// define getter function for harmony exports
    /******/ 	__webpack_require__.d = function(exports, name, getter) {
    /******/ 		if(!__webpack_require__.o(exports, name)) {
    /******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
    /******/ 		}
    /******/ 	};
    /******/
    /******/ 	// define __esModule on exports
    /******/ 	__webpack_require__.r = function(exports) {
    /******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    /******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    /******/ 		}
    /******/ 		Object.defineProperty(exports, '__esModule', { value: true });
    /******/ 	};
    /******/
    /******/ 	// create a fake namespace object
    /******/ 	// mode & 1: value is a module id, require it
    /******/ 	// mode & 2: merge all properties of value into the ns
    /******/ 	// mode & 4: return value when already ns object
    /******/ 	// mode & 8|1: behave like require
    /******/ 	__webpack_require__.t = function(value, mode) {
    /******/ 		if(mode & 1) value = __webpack_require__(value);
    /******/ 		if(mode & 8) return value;
    /******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
    /******/ 		var ns = Object.create(null);
    /******/ 		__webpack_require__.r(ns);
    /******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
    /******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
    /******/ 		return ns;
    /******/ 	};
    /******/
    /******/ 	// getDefaultExport function for compatibility with non-harmony modules
    /******/ 	__webpack_require__.n = function(module) {
    /******/ 		var getter = module && module.__esModule ?
    /******/ 			function getDefault() { return module['default']; } :
    /******/ 			function getModuleExports() { return module; };
    /******/ 		__webpack_require__.d(getter, 'a', getter);
    /******/ 		return getter;
    /******/ 	};
    /******/
    /******/ 	// Object.prototype.hasOwnProperty.call
    /******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
    /******/
    /******/ 	// __webpack_public_path__
    /******/ 	__webpack_require__.p = "";
    /******/
    /******/
    /******/ 	// Load entry module and return exports
    /******/ 	return __webpack_require__(__webpack_require__.s = "./build/index.js");
    /******/ })
    /************************************************************************/
    /******/ ({

    /***/ "./build/index.js":
    /*!************************!*\
      !*** ./build/index.js ***!
      \************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {


    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Socket = exports.io = exports.Manager = exports.protocol = void 0;

    var url_1 = __webpack_require__(/*! ./url */ "./build/url.js");

    var manager_1 = __webpack_require__(/*! ./manager */ "./build/manager.js");

    var socket_1 = __webpack_require__(/*! ./socket */ "./build/socket.js");

    Object.defineProperty(exports, "Socket", {
      enumerable: true,
      get: function get() {
        return socket_1.Socket;
      }
    });

    var debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("socket.io-client");
    /**
     * Module exports.
     */


    module.exports = exports = lookup;
    /**
     * Managers cache.
     */

    var cache = exports.managers = {};

    function lookup(uri, opts) {
      if (_typeof(uri) === "object") {
        opts = uri;
        uri = undefined;
      }

      opts = opts || {};
      var parsed = url_1.url(uri, opts.path);
      var source = parsed.source;
      var id = parsed.id;
      var path = parsed.path;
      var sameNamespace = cache[id] && path in cache[id]["nsps"];
      var newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
      var io;

      if (newConnection) {
        debug("ignoring socket cache for %s", source);
        io = new manager_1.Manager(source, opts);
      } else {
        if (!cache[id]) {
          debug("new io instance for %s", source);
          cache[id] = new manager_1.Manager(source, opts);
        }

        io = cache[id];
      }

      if (parsed.query && !opts.query) {
        opts.query = parsed.queryKey;
      }

      return io.socket(parsed.path, opts);
    }

    exports.io = lookup;
    /**
     * Protocol version.
     *
     * @public
     */

    var socket_io_parser_1 = __webpack_require__(/*! socket.io-parser */ "./node_modules/socket.io-parser/dist/index.js");

    Object.defineProperty(exports, "protocol", {
      enumerable: true,
      get: function get() {
        return socket_io_parser_1.protocol;
      }
    });
    /**
     * `connect`.
     *
     * @param {String} uri
     * @public
     */

    exports.connect = lookup;
    /**
     * Expose constructors for standalone build.
     *
     * @public
     */

    var manager_2 = __webpack_require__(/*! ./manager */ "./build/manager.js");

    Object.defineProperty(exports, "Manager", {
      enumerable: true,
      get: function get() {
        return manager_2.Manager;
      }
    });

    /***/ }),

    /***/ "./build/manager.js":
    /*!**************************!*\
      !*** ./build/manager.js ***!
      \**************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {


    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Manager = void 0;

    var eio = __webpack_require__(/*! engine.io-client */ "./node_modules/engine.io-client/lib/index.js");

    var socket_1 = __webpack_require__(/*! ./socket */ "./build/socket.js");

    var parser = __webpack_require__(/*! socket.io-parser */ "./node_modules/socket.io-parser/dist/index.js");

    var on_1 = __webpack_require__(/*! ./on */ "./build/on.js");

    var Backoff = __webpack_require__(/*! backo2 */ "./node_modules/backo2/index.js");

    var typed_events_1 = __webpack_require__(/*! ./typed-events */ "./build/typed-events.js");

    var debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("socket.io-client:manager");

    var Manager = /*#__PURE__*/function (_typed_events_1$Stric) {
      _inherits(Manager, _typed_events_1$Stric);

      var _super = _createSuper(Manager);

      function Manager(uri, opts) {
        var _this;

        _classCallCheck(this, Manager);

        _this = _super.call(this);
        _this.nsps = {};
        _this.subs = [];

        if (uri && "object" === _typeof(uri)) {
          opts = uri;
          uri = undefined;
        }

        opts = opts || {};
        opts.path = opts.path || "/socket.io";
        _this.opts = opts;

        _this.reconnection(opts.reconnection !== false);

        _this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);

        _this.reconnectionDelay(opts.reconnectionDelay || 1000);

        _this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);

        _this.randomizationFactor(opts.randomizationFactor || 0.5);

        _this.backoff = new Backoff({
          min: _this.reconnectionDelay(),
          max: _this.reconnectionDelayMax(),
          jitter: _this.randomizationFactor()
        });

        _this.timeout(null == opts.timeout ? 20000 : opts.timeout);

        _this._readyState = "closed";
        _this.uri = uri;

        var _parser = opts.parser || parser;

        _this.encoder = new _parser.Encoder();
        _this.decoder = new _parser.Decoder();
        _this._autoConnect = opts.autoConnect !== false;
        if (_this._autoConnect) _this.open();
        return _this;
      }

      _createClass(Manager, [{
        key: "reconnection",
        value: function reconnection(v) {
          if (!arguments.length) return this._reconnection;
          this._reconnection = !!v;
          return this;
        }
      }, {
        key: "reconnectionAttempts",
        value: function reconnectionAttempts(v) {
          if (v === undefined) return this._reconnectionAttempts;
          this._reconnectionAttempts = v;
          return this;
        }
      }, {
        key: "reconnectionDelay",
        value: function reconnectionDelay(v) {
          var _a;

          if (v === undefined) return this._reconnectionDelay;
          this._reconnectionDelay = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
          return this;
        }
      }, {
        key: "randomizationFactor",
        value: function randomizationFactor(v) {
          var _a;

          if (v === undefined) return this._randomizationFactor;
          this._randomizationFactor = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
          return this;
        }
      }, {
        key: "reconnectionDelayMax",
        value: function reconnectionDelayMax(v) {
          var _a;

          if (v === undefined) return this._reconnectionDelayMax;
          this._reconnectionDelayMax = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
          return this;
        }
      }, {
        key: "timeout",
        value: function timeout(v) {
          if (!arguments.length) return this._timeout;
          this._timeout = v;
          return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */

      }, {
        key: "maybeReconnectOnOpen",
        value: function maybeReconnectOnOpen() {
          // Only try to reconnect if it's the first time we're connecting
          if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
            // keeps reconnection from firing twice for the same reconnection loop
            this.reconnect();
          }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */

      }, {
        key: "open",
        value: function open(fn) {
          var _this2 = this;

          debug("readyState %s", this._readyState);
          if (~this._readyState.indexOf("open")) return this;
          debug("opening %s", this.uri);
          this.engine = eio(this.uri, this.opts);
          var socket = this.engine;
          var self = this;
          this._readyState = "opening";
          this.skipReconnect = false; // emit `open`

          var openSubDestroy = on_1.on(socket, "open", function () {
            self.onopen();
            fn && fn();
          }); // emit `error`

          var errorSub = on_1.on(socket, "error", function (err) {
            debug("error");
            self.cleanup();
            self._readyState = "closed";

            _this2.emitReserved("error", err);

            if (fn) {
              fn(err);
            } else {
              // Only do this if there is no fn to handle the error
              self.maybeReconnectOnOpen();
            }
          });

          if (false !== this._timeout) {
            var timeout = this._timeout;
            debug("connect attempt will timeout after %d", timeout);

            if (timeout === 0) {
              openSubDestroy(); // prevents a race condition with the 'open' event
            } // set timer


            var timer = setTimeout(function () {
              debug("connect attempt timed out after %d", timeout);
              openSubDestroy();
              socket.close();
              socket.emit("error", new Error("timeout"));
            }, timeout);

            if (this.opts.autoUnref) {
              timer.unref();
            }

            this.subs.push(function subDestroy() {
              clearTimeout(timer);
            });
          }

          this.subs.push(openSubDestroy);
          this.subs.push(errorSub);
          return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */

      }, {
        key: "connect",
        value: function connect(fn) {
          return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */

      }, {
        key: "onopen",
        value: function onopen() {
          debug("open"); // clear old subs

          this.cleanup(); // mark as open

          this._readyState = "open";
          this.emitReserved("open"); // add new subs

          var socket = this.engine;
          this.subs.push(on_1.on(socket, "ping", this.onping.bind(this)), on_1.on(socket, "data", this.ondata.bind(this)), on_1.on(socket, "error", this.onerror.bind(this)), on_1.on(socket, "close", this.onclose.bind(this)), on_1.on(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */

      }, {
        key: "onping",
        value: function onping() {
          this.emitReserved("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */

      }, {
        key: "ondata",
        value: function ondata(data) {
          this.decoder.add(data);
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */

      }, {
        key: "ondecoded",
        value: function ondecoded(packet) {
          this.emitReserved("packet", packet);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */

      }, {
        key: "onerror",
        value: function onerror(err) {
          debug("error", err);
          this.emitReserved("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */

      }, {
        key: "socket",
        value: function socket(nsp, opts) {
          var socket = this.nsps[nsp];

          if (!socket) {
            socket = new socket_1.Socket(this, nsp, opts);
            this.nsps[nsp] = socket;
          }

          return socket;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */

      }, {
        key: "_destroy",
        value: function _destroy(socket) {
          var nsps = Object.keys(this.nsps);

          for (var _i = 0, _nsps = nsps; _i < _nsps.length; _i++) {
            var nsp = _nsps[_i];
            var _socket = this.nsps[nsp];

            if (_socket.active) {
              debug("socket %s is still active, skipping close", nsp);
              return;
            }
          }

          this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */

      }, {
        key: "_packet",
        value: function _packet(packet) {
          debug("writing packet %j", packet);
          var encodedPackets = this.encoder.encode(packet);

          for (var i = 0; i < encodedPackets.length; i++) {
            this.engine.write(encodedPackets[i], packet.options);
          }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */

      }, {
        key: "cleanup",
        value: function cleanup() {
          debug("cleanup");
          this.subs.forEach(function (subDestroy) {
            return subDestroy();
          });
          this.subs.length = 0;
          this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */

      }, {
        key: "_close",
        value: function _close() {
          debug("disconnect");
          this.skipReconnect = true;
          this._reconnecting = false;

          if ("opening" === this._readyState) {
            // `onclose` will not fire because
            // an open event never happened
            this.cleanup();
          }

          this.backoff.reset();
          this._readyState = "closed";
          if (this.engine) this.engine.close();
        }
        /**
         * Alias for close()
         *
         * @private
         */

      }, {
        key: "disconnect",
        value: function disconnect() {
          return this._close();
        }
        /**
         * Called upon engine close.
         *
         * @private
         */

      }, {
        key: "onclose",
        value: function onclose(reason) {
          debug("onclose");
          this.cleanup();
          this.backoff.reset();
          this._readyState = "closed";
          this.emitReserved("close", reason);

          if (this._reconnection && !this.skipReconnect) {
            this.reconnect();
          }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */

      }, {
        key: "reconnect",
        value: function reconnect() {
          var _this3 = this;

          if (this._reconnecting || this.skipReconnect) return this;
          var self = this;

          if (this.backoff.attempts >= this._reconnectionAttempts) {
            debug("reconnect failed");
            this.backoff.reset();
            this.emitReserved("reconnect_failed");
            this._reconnecting = false;
          } else {
            var delay = this.backoff.duration();
            debug("will wait %dms before reconnect attempt", delay);
            this._reconnecting = true;
            var timer = setTimeout(function () {
              if (self.skipReconnect) return;
              debug("attempting reconnect");

              _this3.emitReserved("reconnect_attempt", self.backoff.attempts); // check again for the case socket closed in above events


              if (self.skipReconnect) return;
              self.open(function (err) {
                if (err) {
                  debug("reconnect attempt error");
                  self._reconnecting = false;
                  self.reconnect();

                  _this3.emitReserved("reconnect_error", err);
                } else {
                  debug("reconnect success");
                  self.onreconnect();
                }
              });
            }, delay);

            if (this.opts.autoUnref) {
              timer.unref();
            }

            this.subs.push(function subDestroy() {
              clearTimeout(timer);
            });
          }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */

      }, {
        key: "onreconnect",
        value: function onreconnect() {
          var attempt = this.backoff.attempts;
          this._reconnecting = false;
          this.backoff.reset();
          this.emitReserved("reconnect", attempt);
        }
      }]);

      return Manager;
    }(typed_events_1.StrictEventEmitter);

    exports.Manager = Manager;

    /***/ }),

    /***/ "./build/on.js":
    /*!*********************!*\
      !*** ./build/on.js ***!
      \*********************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.on = void 0;

    function on(obj, ev, fn) {
      obj.on(ev, fn);
      return function subDestroy() {
        obj.off(ev, fn);
      };
    }

    exports.on = on;

    /***/ }),

    /***/ "./build/socket.js":
    /*!*************************!*\
      !*** ./build/socket.js ***!
      \*************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {


    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

    function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

    function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Socket = void 0;

    var socket_io_parser_1 = __webpack_require__(/*! socket.io-parser */ "./node_modules/socket.io-parser/dist/index.js");

    var on_1 = __webpack_require__(/*! ./on */ "./build/on.js");

    var typed_events_1 = __webpack_require__(/*! ./typed-events */ "./build/typed-events.js");

    var debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("socket.io-client:socket");
    /**
     * Internal events.
     * These events can't be emitted by the user.
     */


    var RESERVED_EVENTS = Object.freeze({
      connect: 1,
      connect_error: 1,
      disconnect: 1,
      disconnecting: 1,
      // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
      newListener: 1,
      removeListener: 1
    });

    var Socket = /*#__PURE__*/function (_typed_events_1$Stric) {
      _inherits(Socket, _typed_events_1$Stric);

      var _super = _createSuper(Socket);

      /**
       * `Socket` constructor.
       *
       * @public
       */
      function Socket(io, nsp, opts) {
        var _this;

        _classCallCheck(this, Socket);

        _this = _super.call(this);
        _this.receiveBuffer = [];
        _this.sendBuffer = [];
        _this.ids = 0;
        _this.acks = {};
        _this.flags = {};
        _this.io = io;
        _this.nsp = nsp;
        _this.ids = 0;
        _this.acks = {};
        _this.receiveBuffer = [];
        _this.sendBuffer = [];
        _this.connected = false;
        _this.disconnected = true;
        _this.flags = {};

        if (opts && opts.auth) {
          _this.auth = opts.auth;
        }

        if (_this.io._autoConnect) _this.open();
        return _this;
      }
      /**
       * Subscribe to open, close and packet events
       *
       * @private
       */


      _createClass(Socket, [{
        key: "subEvents",
        value: function subEvents() {
          if (this.subs) return;
          var io = this.io;
          this.subs = [on_1.on(io, "open", this.onopen.bind(this)), on_1.on(io, "packet", this.onpacket.bind(this)), on_1.on(io, "error", this.onerror.bind(this)), on_1.on(io, "close", this.onclose.bind(this))];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects
         */

      }, {
        key: "connect",

        /**
         * "Opens" the socket.
         *
         * @public
         */
        value: function connect() {
          if (this.connected) return this;
          this.subEvents();
          if (!this.io["_reconnecting"]) this.io.open(); // ensure open

          if ("open" === this.io._readyState) this.onopen();
          return this;
        }
        /**
         * Alias for connect()
         */

      }, {
        key: "open",
        value: function open() {
          return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * @return self
         * @public
         */

      }, {
        key: "send",
        value: function send() {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          args.unshift("message");
          this.emit.apply(this, args);
          return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @return self
         * @public
         */

      }, {
        key: "emit",
        value: function emit(ev) {
          if (RESERVED_EVENTS.hasOwnProperty(ev)) {
            throw new Error('"' + ev + '" is a reserved event name');
          }

          for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }

          args.unshift(ev);
          var packet = {
            type: socket_io_parser_1.PacketType.EVENT,
            data: args
          };
          packet.options = {};
          packet.options.compress = this.flags.compress !== false; // event ack callback

          if ("function" === typeof args[args.length - 1]) {
            debug("emitting packet with ack id %d", this.ids);
            this.acks[this.ids] = args.pop();
            packet.id = this.ids++;
          }

          var isTransportWritable = this.io.engine && this.io.engine.transport && this.io.engine.transport.writable;
          var discardPacket = this.flags["volatile"] && (!isTransportWritable || !this.connected);

          if (discardPacket) {
            debug("discard packet as the transport is not currently writable");
          } else if (this.connected) {
            this.packet(packet);
          } else {
            this.sendBuffer.push(packet);
          }

          this.flags = {};
          return this;
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */

      }, {
        key: "packet",
        value: function packet(_packet) {
          _packet.nsp = this.nsp;

          this.io._packet(_packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */

      }, {
        key: "onopen",
        value: function onopen() {
          var _this2 = this;

          debug("transport is open - connecting");

          if (typeof this.auth == "function") {
            this.auth(function (data) {
              _this2.packet({
                type: socket_io_parser_1.PacketType.CONNECT,
                data: data
              });
            });
          } else {
            this.packet({
              type: socket_io_parser_1.PacketType.CONNECT,
              data: this.auth
            });
          }
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */

      }, {
        key: "onerror",
        value: function onerror(err) {
          if (!this.connected) {
            this.emitReserved("connect_error", err);
          }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @private
         */

      }, {
        key: "onclose",
        value: function onclose(reason) {
          debug("close (%s)", reason);
          this.connected = false;
          this.disconnected = true;
          delete this.id;
          this.emitReserved("disconnect", reason);
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */

      }, {
        key: "onpacket",
        value: function onpacket(packet) {
          var sameNamespace = packet.nsp === this.nsp;
          if (!sameNamespace) return;

          switch (packet.type) {
            case socket_io_parser_1.PacketType.CONNECT:
              if (packet.data && packet.data.sid) {
                var id = packet.data.sid;
                this.onconnect(id);
              } else {
                this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
              }

              break;

            case socket_io_parser_1.PacketType.EVENT:
              this.onevent(packet);
              break;

            case socket_io_parser_1.PacketType.BINARY_EVENT:
              this.onevent(packet);
              break;

            case socket_io_parser_1.PacketType.ACK:
              this.onack(packet);
              break;

            case socket_io_parser_1.PacketType.BINARY_ACK:
              this.onack(packet);
              break;

            case socket_io_parser_1.PacketType.DISCONNECT:
              this.ondisconnect();
              break;

            case socket_io_parser_1.PacketType.CONNECT_ERROR:
              var err = new Error(packet.data.message); // @ts-ignore

              err.data = packet.data.data;
              this.emitReserved("connect_error", err);
              break;
          }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */

      }, {
        key: "onevent",
        value: function onevent(packet) {
          var args = packet.data || [];
          debug("emitting event %j", args);

          if (null != packet.id) {
            debug("attaching ack callback to event");
            args.push(this.ack(packet.id));
          }

          if (this.connected) {
            this.emitEvent(args);
          } else {
            this.receiveBuffer.push(Object.freeze(args));
          }
        }
      }, {
        key: "emitEvent",
        value: function emitEvent(args) {
          if (this._anyListeners && this._anyListeners.length) {
            var listeners = this._anyListeners.slice();

            var _iterator = _createForOfIteratorHelper(listeners),
                _step;

            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var listener = _step.value;
                listener.apply(this, args);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }

          _get(_getPrototypeOf(Socket.prototype), "emit", this).apply(this, args);
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */

      }, {
        key: "ack",
        value: function ack(id) {
          var self = this;
          var sent = false;
          return function () {
            // prevent double callbacks
            if (sent) return;
            sent = true;

            for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
              args[_key3] = arguments[_key3];
            }

            debug("sending ack %j", args);
            self.packet({
              type: socket_io_parser_1.PacketType.ACK,
              id: id,
              data: args
            });
          };
        }
        /**
         * Called upon a server acknowlegement.
         *
         * @param packet
         * @private
         */

      }, {
        key: "onack",
        value: function onack(packet) {
          var ack = this.acks[packet.id];

          if ("function" === typeof ack) {
            debug("calling ack %s with %j", packet.id, packet.data);
            ack.apply(this, packet.data);
            delete this.acks[packet.id];
          } else {
            debug("bad ack %s", packet.id);
          }
        }
        /**
         * Called upon server connect.
         *
         * @private
         */

      }, {
        key: "onconnect",
        value: function onconnect(id) {
          debug("socket connected with id %s", id);
          this.id = id;
          this.connected = true;
          this.disconnected = false;
          this.emitReserved("connect");
          this.emitBuffered();
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */

      }, {
        key: "emitBuffered",
        value: function emitBuffered() {
          var _this3 = this;

          this.receiveBuffer.forEach(function (args) {
            return _this3.emitEvent(args);
          });
          this.receiveBuffer = [];
          this.sendBuffer.forEach(function (packet) {
            return _this3.packet(packet);
          });
          this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */

      }, {
        key: "ondisconnect",
        value: function ondisconnect() {
          debug("server disconnect (%s)", this.nsp);
          this.destroy();
          this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */

      }, {
        key: "destroy",
        value: function destroy() {
          if (this.subs) {
            // clean subscriptions to avoid reconnections
            this.subs.forEach(function (subDestroy) {
              return subDestroy();
            });
            this.subs = undefined;
          }

          this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually.
         *
         * @return self
         * @public
         */

      }, {
        key: "disconnect",
        value: function disconnect() {
          if (this.connected) {
            debug("performing disconnect (%s)", this.nsp);
            this.packet({
              type: socket_io_parser_1.PacketType.DISCONNECT
            });
          } // remove socket from pool


          this.destroy();

          if (this.connected) {
            // fire events
            this.onclose("io client disconnect");
          }

          return this;
        }
        /**
         * Alias for disconnect()
         *
         * @return self
         * @public
         */

      }, {
        key: "close",
        value: function close() {
          return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         * @public
         */

      }, {
        key: "compress",
        value: function compress(_compress) {
          this.flags.compress = _compress;
          return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @returns self
         * @public
         */

      }, {
        key: "onAny",

        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @param listener
         * @public
         */
        value: function onAny(listener) {
          this._anyListeners = this._anyListeners || [];

          this._anyListeners.push(listener);

          return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @param listener
         * @public
         */

      }, {
        key: "prependAny",
        value: function prependAny(listener) {
          this._anyListeners = this._anyListeners || [];

          this._anyListeners.unshift(listener);

          return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @param listener
         * @public
         */

      }, {
        key: "offAny",
        value: function offAny(listener) {
          if (!this._anyListeners) {
            return this;
          }

          if (listener) {
            var listeners = this._anyListeners;

            for (var i = 0; i < listeners.length; i++) {
              if (listener === listeners[i]) {
                listeners.splice(i, 1);
                return this;
              }
            }
          } else {
            this._anyListeners = [];
          }

          return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         *
         * @public
         */

      }, {
        key: "listenersAny",
        value: function listenersAny() {
          return this._anyListeners || [];
        }
      }, {
        key: "active",
        get: function get() {
          return !!this.subs;
        }
      }, {
        key: "volatile",
        get: function get() {
          this.flags["volatile"] = true;
          return this;
        }
      }]);

      return Socket;
    }(typed_events_1.StrictEventEmitter);

    exports.Socket = Socket;

    /***/ }),

    /***/ "./build/typed-events.js":
    /*!*******************************!*\
      !*** ./build/typed-events.js ***!
      \*******************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {


    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

    function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.StrictEventEmitter = void 0;

    var Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");
    /**
     * Strictly typed version of an `EventEmitter`. A `TypedEventEmitter` takes type
     * parameters for mappings of event names to event data types, and strictly
     * types method calls to the `EventEmitter` according to these event maps.
     *
     * @typeParam ListenEvents - `EventsMap` of user-defined events that can be
     * listened to with `on` or `once`
     * @typeParam EmitEvents - `EventsMap` of user-defined events that can be
     * emitted with `emit`
     * @typeParam ReservedEvents - `EventsMap` of reserved events, that can be
     * emitted by socket.io with `emitReserved`, and can be listened to with
     * `listen`.
     */


    var StrictEventEmitter = /*#__PURE__*/function (_Emitter) {
      _inherits(StrictEventEmitter, _Emitter);

      var _super = _createSuper(StrictEventEmitter);

      function StrictEventEmitter() {
        _classCallCheck(this, StrictEventEmitter);

        return _super.apply(this, arguments);
      }

      _createClass(StrictEventEmitter, [{
        key: "on",

        /**
         * Adds the `listener` function as an event listener for `ev`.
         *
         * @param ev Name of the event
         * @param listener Callback function
         */
        value: function on(ev, listener) {
          _get(_getPrototypeOf(StrictEventEmitter.prototype), "on", this).call(this, ev, listener);

          return this;
        }
        /**
         * Adds a one-time `listener` function as an event listener for `ev`.
         *
         * @param ev Name of the event
         * @param listener Callback function
         */

      }, {
        key: "once",
        value: function once(ev, listener) {
          _get(_getPrototypeOf(StrictEventEmitter.prototype), "once", this).call(this, ev, listener);

          return this;
        }
        /**
         * Emits an event.
         *
         * @param ev Name of the event
         * @param args Values to send to listeners of this event
         */

      }, {
        key: "emit",
        value: function emit(ev) {
          var _get2;

          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          (_get2 = _get(_getPrototypeOf(StrictEventEmitter.prototype), "emit", this)).call.apply(_get2, [this, ev].concat(args));

          return this;
        }
        /**
         * Emits a reserved event.
         *
         * This method is `protected`, so that only a class extending
         * `StrictEventEmitter` can emit its own reserved events.
         *
         * @param ev Reserved event name
         * @param args Arguments to emit along with the event
         */

      }, {
        key: "emitReserved",
        value: function emitReserved(ev) {
          var _get3;

          for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }

          (_get3 = _get(_getPrototypeOf(StrictEventEmitter.prototype), "emit", this)).call.apply(_get3, [this, ev].concat(args));

          return this;
        }
        /**
         * Returns the listeners listening to an event.
         *
         * @param event Event name
         * @returns Array of listeners subscribed to `event`
         */

      }, {
        key: "listeners",
        value: function listeners(event) {
          return _get(_getPrototypeOf(StrictEventEmitter.prototype), "listeners", this).call(this, event);
        }
      }]);

      return StrictEventEmitter;
    }(Emitter);

    exports.StrictEventEmitter = StrictEventEmitter;

    /***/ }),

    /***/ "./build/url.js":
    /*!**********************!*\
      !*** ./build/url.js ***!
      \**********************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.url = void 0;

    var parseuri = __webpack_require__(/*! parseuri */ "./node_modules/parseuri/index.js");

    var debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("socket.io-client:url");
    /**
     * URL parser.
     *
     * @param uri - url
     * @param path - the request path of the connection
     * @param loc - An object meant to mimic window.location.
     *        Defaults to window.location.
     * @public
     */


    function url(uri) {
      var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
      var loc = arguments.length > 2 ? arguments[2] : undefined;
      var obj = uri; // default to window.location

      loc = loc || typeof location !== "undefined" && location;
      if (null == uri) uri = loc.protocol + "//" + loc.host; // relative path support

      if (typeof uri === "string") {
        if ("/" === uri.charAt(0)) {
          if ("/" === uri.charAt(1)) {
            uri = loc.protocol + uri;
          } else {
            uri = loc.host + uri;
          }
        }

        if (!/^(https?|wss?):\/\//.test(uri)) {
          debug("protocol-less url %s", uri);

          if ("undefined" !== typeof loc) {
            uri = loc.protocol + "//" + uri;
          } else {
            uri = "https://" + uri;
          }
        } // parse


        debug("parse %s", uri);
        obj = parseuri(uri);
      } // make sure we treat `localhost:80` and `localhost` equally


      if (!obj.port) {
        if (/^(http|ws)$/.test(obj.protocol)) {
          obj.port = "80";
        } else if (/^(http|ws)s$/.test(obj.protocol)) {
          obj.port = "443";
        }
      }

      obj.path = obj.path || "/";
      var ipv6 = obj.host.indexOf(":") !== -1;
      var host = ipv6 ? "[" + obj.host + "]" : obj.host; // define unique id

      obj.id = obj.protocol + "://" + host + ":" + obj.port + path; // define href

      obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
      return obj;
    }

    exports.url = url;

    /***/ }),

    /***/ "./node_modules/backo2/index.js":
    /*!**************************************!*\
      !*** ./node_modules/backo2/index.js ***!
      \**************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    /**
     * Expose `Backoff`.
     */
    module.exports = Backoff;
    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */

    function Backoff(opts) {
      opts = opts || {};
      this.ms = opts.min || 100;
      this.max = opts.max || 10000;
      this.factor = opts.factor || 2;
      this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
      this.attempts = 0;
    }
    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */


    Backoff.prototype.duration = function () {
      var ms = this.ms * Math.pow(this.factor, this.attempts++);

      if (this.jitter) {
        var rand = Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
      }

      return Math.min(ms, this.max) | 0;
    };
    /**
     * Reset the number of attempts.
     *
     * @api public
     */


    Backoff.prototype.reset = function () {
      this.attempts = 0;
    };
    /**
     * Set the minimum duration
     *
     * @api public
     */


    Backoff.prototype.setMin = function (min) {
      this.ms = min;
    };
    /**
     * Set the maximum duration
     *
     * @api public
     */


    Backoff.prototype.setMax = function (max) {
      this.max = max;
    };
    /**
     * Set the jitter
     *
     * @api public
     */


    Backoff.prototype.setJitter = function (jitter) {
      this.jitter = jitter;
    };

    /***/ }),

    /***/ "./node_modules/component-emitter/index.js":
    /*!*************************************************!*\
      !*** ./node_modules/component-emitter/index.js ***!
      \*************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    /**
     * Expose `Emitter`.
     */
    {
      module.exports = Emitter;
    }
    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */


    function Emitter(obj) {
      if (obj) return mixin(obj);
    }
    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }

      return obj;
    }
    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */


    Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
      this._callbacks = this._callbacks || {};
      (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
      return this;
    };
    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */


    Emitter.prototype.once = function (event, fn) {
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }

      on.fn = fn;
      this.on(event, on);
      return this;
    };
    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */


    Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
      this._callbacks = this._callbacks || {}; // all

      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      } // specific event


      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this; // remove all handlers

      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      } // remove specific handler


      var cb;

      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];

        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      } // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.


      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };
    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */


    Emitter.prototype.emit = function (event) {
      this._callbacks = this._callbacks || {};
      var args = new Array(arguments.length - 1),
          callbacks = this._callbacks['$' + event];

      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }

      if (callbacks) {
        callbacks = callbacks.slice(0);

        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }

      return this;
    };
    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */


    Emitter.prototype.listeners = function (event) {
      this._callbacks = this._callbacks || {};
      return this._callbacks['$' + event] || [];
    };
    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */


    Emitter.prototype.hasListeners = function (event) {
      return !!this.listeners(event).length;
    };

    /***/ }),

    /***/ "./node_modules/debug/src/browser.js":
    /*!*******************************************!*\
      !*** ./node_modules/debug/src/browser.js ***!
      \*******************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    /* eslint-env browser */

    /**
     * This is the web browser implementation of `debug()`.
     */
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();

    exports.destroy = function () {
      var warned = false;
      return function () {
        if (!warned) {
          warned = true;
          console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
        }
      };
    }();
    /**
     * Colors.
     */


    exports.colors = ['#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC', '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC', '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF', '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC', '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933', '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC', '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF', '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'];
    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */
    // eslint-disable-next-line complexity

    function useColors() {
      // NB: In an Electron preload script, document will be defined but not fully
      // initialized. Since we know we're in Chrome, we'll just detect this case
      // explicitly
      if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
        return true;
      } // Internet Explorer and Edge do not support colors.


      if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      } // Is webkit? http://stackoverflow.com/a/16459606/376773
      // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632


      return typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== 'undefined' && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */


    function formatArgs(args) {
      args[0] = (this.useColors ? '%c' : '') + this.namespace + (this.useColors ? ' %c' : ' ') + args[0] + (this.useColors ? '%c ' : ' ') + '+' + module.exports.humanize(this.diff);

      if (!this.useColors) {
        return;
      }

      var c = 'color: ' + this.color;
      args.splice(1, 0, c, 'color: inherit'); // The final "%c" is somewhat tricky, because there could be other
      // arguments passed either before or after the %c, so we need to
      // figure out the correct index to insert the CSS into

      var index = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function (match) {
        if (match === '%%') {
          return;
        }

        index++;

        if (match === '%c') {
          // We only are interested in the *last* %c
          // (the user may have provided their own)
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    /**
     * Invokes `console.debug()` when available.
     * No-op when `console.debug` is not a "function".
     * If `console.debug` is not available, falls back
     * to `console.log`.
     *
     * @api public
     */


    exports.log = console.debug || console.log || function () {};
    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */


    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem('debug', namespaces);
        } else {
          exports.storage.removeItem('debug');
        }
      } catch (error) {// Swallow
        // XXX (@Qix-) should we be logging these?
      }
    }
    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */


    function load() {
      var r;

      try {
        r = exports.storage.getItem('debug');
      } catch (error) {// Swallow
        // XXX (@Qix-) should we be logging these?
      } // If debug isn't set in LS, and we're in Electron, try to load $DEBUG


      if (!r && typeof process !== 'undefined' && 'env' in process) {
        r = process.env.DEBUG;
      }

      return r;
    }
    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */


    function localstorage() {
      try {
        // TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
        // The Browser also has localStorage in the global context.
        return localStorage;
      } catch (error) {// Swallow
        // XXX (@Qix-) should we be logging these?
      }
    }

    module.exports = __webpack_require__(/*! ./common */ "./node_modules/debug/src/common.js")(exports);
    var formatters = module.exports.formatters;
    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    formatters.j = function (v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return '[UnexpectedJSONParseError]: ' + error.message;
      }
    };

    /***/ }),

    /***/ "./node_modules/debug/src/common.js":
    /*!******************************************!*\
      !*** ./node_modules/debug/src/common.js ***!
      \******************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

    function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

    function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

    function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

    function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

    function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     */
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug["default"] = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = __webpack_require__(/*! ms */ "./node_modules/ms/index.js");
      createDebug.destroy = destroy;
      Object.keys(env).forEach(function (key) {
        createDebug[key] = env[key];
      });
      /**
      * The currently active debug mode names, and names to skip.
      */

      createDebug.names = [];
      createDebug.skips = [];
      /**
      * Map of special "%n" handling functions, for the debug "format" argument.
      *
      * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
      */

      createDebug.formatters = {};
      /**
      * Selects a color for a debug namespace
      * @param {String} namespace The namespace string for the for the debug instance to be colored
      * @return {Number|String} An ANSI color code for the given namespace
      * @api private
      */

      function selectColor(namespace) {
        var hash = 0;

        for (var i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0; // Convert to 32bit integer
        }

        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }

      createDebug.selectColor = selectColor;
      /**
      * Create a debugger with the given `namespace`.
      *
      * @param {String} namespace
      * @return {Function}
      * @api public
      */

      function createDebug(namespace) {
        var prevTime;
        var enableOverride = null;

        function debug() {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          // Disabled?
          if (!debug.enabled) {
            return;
          }

          var self = debug; // Set `diff` timestamp

          var curr = Number(new Date());
          var ms = curr - (prevTime || curr);
          self.diff = ms;
          self.prev = prevTime;
          self.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);

          if (typeof args[0] !== 'string') {
            // Anything else let's inspect with %O
            args.unshift('%O');
          } // Apply any `formatters` transformations


          var index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, function (match, format) {
            // If we encounter an escaped % then don't increase the array index
            if (match === '%%') {
              return '%';
            }

            index++;
            var formatter = createDebug.formatters[format];

            if (typeof formatter === 'function') {
              var val = args[index];
              match = formatter.call(self, val); // Now we need to remove `args[index]` since it's inlined in the `format`

              args.splice(index, 1);
              index--;
            }

            return match;
          }); // Apply env-specific formatting (colors, etc.)

          createDebug.formatArgs.call(self, args);
          var logFn = self.log || createDebug.log;
          logFn.apply(self, args);
        }

        debug.namespace = namespace;
        debug.useColors = createDebug.useColors();
        debug.color = createDebug.selectColor(namespace);
        debug.extend = extend;
        debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

        Object.defineProperty(debug, 'enabled', {
          enumerable: true,
          configurable: false,
          get: function get() {
            return enableOverride === null ? createDebug.enabled(namespace) : enableOverride;
          },
          set: function set(v) {
            enableOverride = v;
          }
        }); // Env-specific initialization logic for debug instances

        if (typeof createDebug.init === 'function') {
          createDebug.init(debug);
        }

        return debug;
      }

      function extend(namespace, delimiter) {
        var newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      /**
      * Enables a debug mode by namespaces. This can include modes
      * separated by a colon and wildcards.
      *
      * @param {String} namespaces
      * @api public
      */


      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.names = [];
        createDebug.skips = [];
        var i;
        var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
        var len = split.length;

        for (i = 0; i < len; i++) {
          if (!split[i]) {
            // ignore empty strings
            continue;
          }

          namespaces = split[i].replace(/\*/g, '.*?');

          if (namespaces[0] === '-') {
            createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
          } else {
            createDebug.names.push(new RegExp('^' + namespaces + '$'));
          }
        }
      }
      /**
      * Disable debug output.
      *
      * @return {String} namespaces
      * @api public
      */


      function disable() {
        var namespaces = [].concat(_toConsumableArray(createDebug.names.map(toNamespace)), _toConsumableArray(createDebug.skips.map(toNamespace).map(function (namespace) {
          return '-' + namespace;
        }))).join(',');
        createDebug.enable('');
        return namespaces;
      }
      /**
      * Returns true if the given mode name is enabled, false otherwise.
      *
      * @param {String} name
      * @return {Boolean}
      * @api public
      */


      function enabled(name) {
        if (name[name.length - 1] === '*') {
          return true;
        }

        var i;
        var len;

        for (i = 0, len = createDebug.skips.length; i < len; i++) {
          if (createDebug.skips[i].test(name)) {
            return false;
          }
        }

        for (i = 0, len = createDebug.names.length; i < len; i++) {
          if (createDebug.names[i].test(name)) {
            return true;
          }
        }

        return false;
      }
      /**
      * Convert regexp to namespace
      *
      * @param {RegExp} regxep
      * @return {String} namespace
      * @api private
      */


      function toNamespace(regexp) {
        return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, '*');
      }
      /**
      * Coerce `val`.
      *
      * @param {Mixed} val
      * @return {Mixed}
      * @api private
      */


      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }

        return val;
      }
      /**
      * XXX DO NOT USE. This is a temporary stub function.
      * XXX It WILL be removed in the next major release.
      */


      function destroy() {
        console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
      }

      createDebug.enable(createDebug.load());
      return createDebug;
    }

    module.exports = setup;

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/globalThis.browser.js":
    /*!*****************************************************************!*\
      !*** ./node_modules/engine.io-client/lib/globalThis.browser.js ***!
      \*****************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    module.exports = function () {
      if (typeof self !== "undefined") {
        return self;
      } else if (typeof window !== "undefined") {
        return window;
      } else {
        return Function("return this")();
      }
    }();

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/index.js":
    /*!****************************************************!*\
      !*** ./node_modules/engine.io-client/lib/index.js ***!
      \****************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    var Socket = __webpack_require__(/*! ./socket */ "./node_modules/engine.io-client/lib/socket.js");

    module.exports = function (uri, opts) {
      return new Socket(uri, opts);
    };
    /**
     * Expose deps for legacy compatibility
     * and standalone browser access.
     */


    module.exports.Socket = Socket;
    module.exports.protocol = Socket.protocol; // this is an int

    module.exports.Transport = __webpack_require__(/*! ./transport */ "./node_modules/engine.io-client/lib/transport.js");
    module.exports.transports = __webpack_require__(/*! ./transports/index */ "./node_modules/engine.io-client/lib/transports/index.js");
    module.exports.parser = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/lib/index.js");

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/socket.js":
    /*!*****************************************************!*\
      !*** ./node_modules/engine.io-client/lib/socket.js ***!
      \*****************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

    var transports = __webpack_require__(/*! ./transports/index */ "./node_modules/engine.io-client/lib/transports/index.js");

    var Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");

    var debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("engine.io-client:socket");

    var parser = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/lib/index.js");

    var parseuri = __webpack_require__(/*! parseuri */ "./node_modules/parseuri/index.js");

    var parseqs = __webpack_require__(/*! parseqs */ "./node_modules/parseqs/index.js");

    var Socket = /*#__PURE__*/function (_Emitter) {
      _inherits(Socket, _Emitter);

      var _super = _createSuper(Socket);

      /**
       * Socket constructor.
       *
       * @param {String|Object} uri or options
       * @param {Object} options
       * @api public
       */
      function Socket(uri) {
        var _this;

        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, Socket);

        _this = _super.call(this);

        if (uri && "object" === _typeof(uri)) {
          opts = uri;
          uri = null;
        }

        if (uri) {
          uri = parseuri(uri);
          opts.hostname = uri.host;
          opts.secure = uri.protocol === "https" || uri.protocol === "wss";
          opts.port = uri.port;
          if (uri.query) opts.query = uri.query;
        } else if (opts.host) {
          opts.hostname = parseuri(opts.host).host;
        }

        _this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;

        if (opts.hostname && !opts.port) {
          // if no port is specified manually, use the protocol default
          opts.port = _this.secure ? "443" : "80";
        }

        _this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
        _this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : _this.secure ? 443 : 80);
        _this.transports = opts.transports || ["polling", "websocket"];
        _this.readyState = "";
        _this.writeBuffer = [];
        _this.prevBufferLen = 0;
        _this.opts = _extends({
          path: "/engine.io",
          agent: false,
          withCredentials: false,
          upgrade: true,
          jsonp: true,
          timestampParam: "t",
          rememberUpgrade: false,
          rejectUnauthorized: true,
          perMessageDeflate: {
            threshold: 1024
          },
          transportOptions: {}
        }, opts);
        _this.opts.path = _this.opts.path.replace(/\/$/, "") + "/";

        if (typeof _this.opts.query === "string") {
          _this.opts.query = parseqs.decode(_this.opts.query);
        } // set on handshake


        _this.id = null;
        _this.upgrades = null;
        _this.pingInterval = null;
        _this.pingTimeout = null; // set on heartbeat

        _this.pingTimeoutTimer = null;

        if (typeof addEventListener === "function") {
          addEventListener("beforeunload", function () {
            if (_this.transport) {
              // silently close the transport
              _this.transport.removeAllListeners();

              _this.transport.close();
            }
          }, false);

          if (_this.hostname !== "localhost") {
            _this.offlineEventListener = function () {
              _this.onClose("transport close");
            };

            addEventListener("offline", _this.offlineEventListener, false);
          }
        }

        _this.open();

        return _this;
      }
      /**
       * Creates transport of the given type.
       *
       * @param {String} transport name
       * @return {Transport}
       * @api private
       */


      _createClass(Socket, [{
        key: "createTransport",
        value: function createTransport(name) {
          debug('creating transport "%s"', name);
          var query = clone(this.opts.query); // append engine.io protocol identifier

          query.EIO = parser.protocol; // transport name

          query.transport = name; // session id if we already have one

          if (this.id) query.sid = this.id;

          var opts = _extends({}, this.opts.transportOptions[name], this.opts, {
            query: query,
            socket: this,
            hostname: this.hostname,
            secure: this.secure,
            port: this.port
          });

          debug("options: %j", opts);
          return new transports[name](opts);
        }
        /**
         * Initializes transport to use and starts probe.
         *
         * @api private
         */

      }, {
        key: "open",
        value: function open() {
          var transport;

          if (this.opts.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1) {
            transport = "websocket";
          } else if (0 === this.transports.length) {
            // Emit error on next tick so it can be listened to
            var self = this;
            setTimeout(function () {
              self.emit("error", "No transports available");
            }, 0);
            return;
          } else {
            transport = this.transports[0];
          }

          this.readyState = "opening"; // Retry with the next transport if the transport is disabled (jsonp: false)

          try {
            transport = this.createTransport(transport);
          } catch (e) {
            debug("error while creating transport: %s", e);
            this.transports.shift();
            this.open();
            return;
          }

          transport.open();
          this.setTransport(transport);
        }
        /**
         * Sets the current transport. Disables the existing one (if any).
         *
         * @api private
         */

      }, {
        key: "setTransport",
        value: function setTransport(transport) {
          debug("setting transport %s", transport.name);
          var self = this;

          if (this.transport) {
            debug("clearing existing transport %s", this.transport.name);
            this.transport.removeAllListeners();
          } // set up transport


          this.transport = transport; // set up transport listeners

          transport.on("drain", function () {
            self.onDrain();
          }).on("packet", function (packet) {
            self.onPacket(packet);
          }).on("error", function (e) {
            self.onError(e);
          }).on("close", function () {
            self.onClose("transport close");
          });
        }
        /**
         * Probes a transport.
         *
         * @param {String} transport name
         * @api private
         */

      }, {
        key: "probe",
        value: function probe(name) {
          debug('probing transport "%s"', name);
          var transport = this.createTransport(name, {
            probe: 1
          });
          var failed = false;
          var self = this;
          Socket.priorWebsocketSuccess = false;

          function onTransportOpen() {
            if (self.onlyBinaryUpgrades) {
              var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
              failed = failed || upgradeLosesBinary;
            }

            if (failed) return;
            debug('probe transport "%s" opened', name);
            transport.send([{
              type: "ping",
              data: "probe"
            }]);
            transport.once("packet", function (msg) {
              if (failed) return;

              if ("pong" === msg.type && "probe" === msg.data) {
                debug('probe transport "%s" pong', name);
                self.upgrading = true;
                self.emit("upgrading", transport);
                if (!transport) return;
                Socket.priorWebsocketSuccess = "websocket" === transport.name;
                debug('pausing current transport "%s"', self.transport.name);
                self.transport.pause(function () {
                  if (failed) return;
                  if ("closed" === self.readyState) return;
                  debug("changing transport and sending upgrade packet");
                  cleanup();
                  self.setTransport(transport);
                  transport.send([{
                    type: "upgrade"
                  }]);
                  self.emit("upgrade", transport);
                  transport = null;
                  self.upgrading = false;
                  self.flush();
                });
              } else {
                debug('probe transport "%s" failed', name);
                var err = new Error("probe error");
                err.transport = transport.name;
                self.emit("upgradeError", err);
              }
            });
          }

          function freezeTransport() {
            if (failed) return; // Any callback called by transport should be ignored since now

            failed = true;
            cleanup();
            transport.close();
            transport = null;
          } // Handle any error that happens while probing


          function onerror(err) {
            var error = new Error("probe error: " + err);
            error.transport = transport.name;
            freezeTransport();
            debug('probe transport "%s" failed because of error: %s', name, err);
            self.emit("upgradeError", error);
          }

          function onTransportClose() {
            onerror("transport closed");
          } // When the socket is closed while we're probing


          function onclose() {
            onerror("socket closed");
          } // When the socket is upgraded while we're probing


          function onupgrade(to) {
            if (transport && to.name !== transport.name) {
              debug('"%s" works - aborting "%s"', to.name, transport.name);
              freezeTransport();
            }
          } // Remove all listeners on the transport and on self


          function cleanup() {
            transport.removeListener("open", onTransportOpen);
            transport.removeListener("error", onerror);
            transport.removeListener("close", onTransportClose);
            self.removeListener("close", onclose);
            self.removeListener("upgrading", onupgrade);
          }

          transport.once("open", onTransportOpen);
          transport.once("error", onerror);
          transport.once("close", onTransportClose);
          this.once("close", onclose);
          this.once("upgrading", onupgrade);
          transport.open();
        }
        /**
         * Called when connection is deemed open.
         *
         * @api public
         */

      }, {
        key: "onOpen",
        value: function onOpen() {
          debug("socket open");
          this.readyState = "open";
          Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
          this.emit("open");
          this.flush(); // we check for `readyState` in case an `open`
          // listener already closed the socket

          if ("open" === this.readyState && this.opts.upgrade && this.transport.pause) {
            debug("starting upgrade probes");
            var i = 0;
            var l = this.upgrades.length;

            for (; i < l; i++) {
              this.probe(this.upgrades[i]);
            }
          }
        }
        /**
         * Handles a packet.
         *
         * @api private
         */

      }, {
        key: "onPacket",
        value: function onPacket(packet) {
          if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
            debug('socket receive: type "%s", data "%s"', packet.type, packet.data);
            this.emit("packet", packet); // Socket is live - any packet counts

            this.emit("heartbeat");

            switch (packet.type) {
              case "open":
                this.onHandshake(JSON.parse(packet.data));
                break;

              case "ping":
                this.resetPingTimeout();
                this.sendPacket("pong");
                this.emit("pong");
                break;

              case "error":
                var err = new Error("server error");
                err.code = packet.data;
                this.onError(err);
                break;

              case "message":
                this.emit("data", packet.data);
                this.emit("message", packet.data);
                break;
            }
          } else {
            debug('packet received with socket readyState "%s"', this.readyState);
          }
        }
        /**
         * Called upon handshake completion.
         *
         * @param {Object} handshake obj
         * @api private
         */

      }, {
        key: "onHandshake",
        value: function onHandshake(data) {
          this.emit("handshake", data);
          this.id = data.sid;
          this.transport.query.sid = data.sid;
          this.upgrades = this.filterUpgrades(data.upgrades);
          this.pingInterval = data.pingInterval;
          this.pingTimeout = data.pingTimeout;
          this.onOpen(); // In case open handler closes socket

          if ("closed" === this.readyState) return;
          this.resetPingTimeout();
        }
        /**
         * Sets and resets ping timeout timer based on server pings.
         *
         * @api private
         */

      }, {
        key: "resetPingTimeout",
        value: function resetPingTimeout() {
          var _this2 = this;

          clearTimeout(this.pingTimeoutTimer);
          this.pingTimeoutTimer = setTimeout(function () {
            _this2.onClose("ping timeout");
          }, this.pingInterval + this.pingTimeout);

          if (this.opts.autoUnref) {
            this.pingTimeoutTimer.unref();
          }
        }
        /**
         * Called on `drain` event
         *
         * @api private
         */

      }, {
        key: "onDrain",
        value: function onDrain() {
          this.writeBuffer.splice(0, this.prevBufferLen); // setting prevBufferLen = 0 is very important
          // for example, when upgrading, upgrade packet is sent over,
          // and a nonzero prevBufferLen could cause problems on `drain`

          this.prevBufferLen = 0;

          if (0 === this.writeBuffer.length) {
            this.emit("drain");
          } else {
            this.flush();
          }
        }
        /**
         * Flush write buffers.
         *
         * @api private
         */

      }, {
        key: "flush",
        value: function flush() {
          if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
            debug("flushing %d packets in socket", this.writeBuffer.length);
            this.transport.send(this.writeBuffer); // keep track of current length of writeBuffer
            // splice writeBuffer and callbackBuffer on `drain`

            this.prevBufferLen = this.writeBuffer.length;
            this.emit("flush");
          }
        }
        /**
         * Sends a message.
         *
         * @param {String} message.
         * @param {Function} callback function.
         * @param {Object} options.
         * @return {Socket} for chaining.
         * @api public
         */

      }, {
        key: "write",
        value: function write(msg, options, fn) {
          this.sendPacket("message", msg, options, fn);
          return this;
        }
      }, {
        key: "send",
        value: function send(msg, options, fn) {
          this.sendPacket("message", msg, options, fn);
          return this;
        }
        /**
         * Sends a packet.
         *
         * @param {String} packet type.
         * @param {String} data.
         * @param {Object} options.
         * @param {Function} callback function.
         * @api private
         */

      }, {
        key: "sendPacket",
        value: function sendPacket(type, data, options, fn) {
          if ("function" === typeof data) {
            fn = data;
            data = undefined;
          }

          if ("function" === typeof options) {
            fn = options;
            options = null;
          }

          if ("closing" === this.readyState || "closed" === this.readyState) {
            return;
          }

          options = options || {};
          options.compress = false !== options.compress;
          var packet = {
            type: type,
            data: data,
            options: options
          };
          this.emit("packetCreate", packet);
          this.writeBuffer.push(packet);
          if (fn) this.once("flush", fn);
          this.flush();
        }
        /**
         * Closes the connection.
         *
         * @api private
         */

      }, {
        key: "close",
        value: function close() {
          var self = this;

          if ("opening" === this.readyState || "open" === this.readyState) {
            this.readyState = "closing";

            if (this.writeBuffer.length) {
              this.once("drain", function () {
                if (this.upgrading) {
                  waitForUpgrade();
                } else {
                  close();
                }
              });
            } else if (this.upgrading) {
              waitForUpgrade();
            } else {
              close();
            }
          }

          function close() {
            self.onClose("forced close");
            debug("socket closing - telling transport to close");
            self.transport.close();
          }

          function cleanupAndClose() {
            self.removeListener("upgrade", cleanupAndClose);
            self.removeListener("upgradeError", cleanupAndClose);
            close();
          }

          function waitForUpgrade() {
            // wait for upgrade to finish since we can't send packets while pausing a transport
            self.once("upgrade", cleanupAndClose);
            self.once("upgradeError", cleanupAndClose);
          }

          return this;
        }
        /**
         * Called upon transport error
         *
         * @api private
         */

      }, {
        key: "onError",
        value: function onError(err) {
          debug("socket error %j", err);
          Socket.priorWebsocketSuccess = false;
          this.emit("error", err);
          this.onClose("transport error", err);
        }
        /**
         * Called upon transport close.
         *
         * @api private
         */

      }, {
        key: "onClose",
        value: function onClose(reason, desc) {
          if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
            debug('socket close with reason: "%s"', reason);
            var self = this; // clear timers

            clearTimeout(this.pingIntervalTimer);
            clearTimeout(this.pingTimeoutTimer); // stop event from firing again for transport

            this.transport.removeAllListeners("close"); // ensure transport won't stay open

            this.transport.close(); // ignore further transport communication

            this.transport.removeAllListeners();

            if (typeof removeEventListener === "function") {
              removeEventListener("offline", this.offlineEventListener, false);
            } // set ready state


            this.readyState = "closed"; // clear session id

            this.id = null; // emit close event

            this.emit("close", reason, desc); // clean buffers after, so users can still
            // grab the buffers on `close` event

            self.writeBuffer = [];
            self.prevBufferLen = 0;
          }
        }
        /**
         * Filters upgrades, returning only those matching client transports.
         *
         * @param {Array} server upgrades
         * @api private
         *
         */

      }, {
        key: "filterUpgrades",
        value: function filterUpgrades(upgrades) {
          var filteredUpgrades = [];
          var i = 0;
          var j = upgrades.length;

          for (; i < j; i++) {
            if (~this.transports.indexOf(upgrades[i])) filteredUpgrades.push(upgrades[i]);
          }

          return filteredUpgrades;
        }
      }]);

      return Socket;
    }(Emitter);

    Socket.priorWebsocketSuccess = false;
    /**
     * Protocol version.
     *
     * @api public
     */

    Socket.protocol = parser.protocol; // this is an int

    function clone(obj) {
      var o = {};

      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          o[i] = obj[i];
        }
      }

      return o;
    }

    module.exports = Socket;

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/transport.js":
    /*!********************************************************!*\
      !*** ./node_modules/engine.io-client/lib/transport.js ***!
      \********************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

    var parser = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/lib/index.js");

    var Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");

    var Transport = /*#__PURE__*/function (_Emitter) {
      _inherits(Transport, _Emitter);

      var _super = _createSuper(Transport);

      /**
       * Transport abstract constructor.
       *
       * @param {Object} options.
       * @api private
       */
      function Transport(opts) {
        var _this;

        _classCallCheck(this, Transport);

        _this = _super.call(this);
        _this.opts = opts;
        _this.query = opts.query;
        _this.readyState = "";
        _this.socket = opts.socket;
        return _this;
      }
      /**
       * Emits an error.
       *
       * @param {String} str
       * @return {Transport} for chaining
       * @api public
       */


      _createClass(Transport, [{
        key: "onError",
        value: function onError(msg, desc) {
          var err = new Error(msg);
          err.type = "TransportError";
          err.description = desc;
          this.emit("error", err);
          return this;
        }
        /**
         * Opens the transport.
         *
         * @api public
         */

      }, {
        key: "open",
        value: function open() {
          if ("closed" === this.readyState || "" === this.readyState) {
            this.readyState = "opening";
            this.doOpen();
          }

          return this;
        }
        /**
         * Closes the transport.
         *
         * @api private
         */

      }, {
        key: "close",
        value: function close() {
          if ("opening" === this.readyState || "open" === this.readyState) {
            this.doClose();
            this.onClose();
          }

          return this;
        }
        /**
         * Sends multiple packets.
         *
         * @param {Array} packets
         * @api private
         */

      }, {
        key: "send",
        value: function send(packets) {
          if ("open" === this.readyState) {
            this.write(packets);
          } else {
            throw new Error("Transport not open");
          }
        }
        /**
         * Called upon open
         *
         * @api private
         */

      }, {
        key: "onOpen",
        value: function onOpen() {
          this.readyState = "open";
          this.writable = true;
          this.emit("open");
        }
        /**
         * Called with data.
         *
         * @param {String} data
         * @api private
         */

      }, {
        key: "onData",
        value: function onData(data) {
          var packet = parser.decodePacket(data, this.socket.binaryType);
          this.onPacket(packet);
        }
        /**
         * Called with a decoded packet.
         */

      }, {
        key: "onPacket",
        value: function onPacket(packet) {
          this.emit("packet", packet);
        }
        /**
         * Called upon close.
         *
         * @api private
         */

      }, {
        key: "onClose",
        value: function onClose() {
          this.readyState = "closed";
          this.emit("close");
        }
      }]);

      return Transport;
    }(Emitter);

    module.exports = Transport;

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/transports/index.js":
    /*!***************************************************************!*\
      !*** ./node_modules/engine.io-client/lib/transports/index.js ***!
      \***************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    var XMLHttpRequest = __webpack_require__(/*! ../../contrib/xmlhttprequest-ssl/XMLHttpRequest */ "./node_modules/engine.io-client/lib/xmlhttprequest.js");

    var XHR = __webpack_require__(/*! ./polling-xhr */ "./node_modules/engine.io-client/lib/transports/polling-xhr.js");

    var JSONP = __webpack_require__(/*! ./polling-jsonp */ "./node_modules/engine.io-client/lib/transports/polling-jsonp.js");

    var websocket = __webpack_require__(/*! ./websocket */ "./node_modules/engine.io-client/lib/transports/websocket.js");

    exports.polling = polling;
    exports.websocket = websocket;
    /**
     * Polling transport polymorphic constructor.
     * Decides on xhr vs jsonp based on feature detection.
     *
     * @api private
     */

    function polling(opts) {
      var xhr;
      var xd = false;
      var xs = false;
      var jsonp = false !== opts.jsonp;

      if (typeof location !== "undefined") {
        var isSSL = "https:" === location.protocol;
        var port = location.port; // some user agents have empty `location.port`

        if (!port) {
          port = isSSL ? 443 : 80;
        }

        xd = opts.hostname !== location.hostname || port !== opts.port;
        xs = opts.secure !== isSSL;
      }

      opts.xdomain = xd;
      opts.xscheme = xs;
      xhr = new XMLHttpRequest(opts);

      if ("open" in xhr && !opts.forceJSONP) {
        return new XHR(opts);
      } else {
        if (!jsonp) throw new Error("JSONP disabled");
        return new JSONP(opts);
      }
    }

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/transports/polling-jsonp.js":
    /*!***********************************************************************!*\
      !*** ./node_modules/engine.io-client/lib/transports/polling-jsonp.js ***!
      \***********************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

    function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

    var Polling = __webpack_require__(/*! ./polling */ "./node_modules/engine.io-client/lib/transports/polling.js");

    var globalThis = __webpack_require__(/*! ../globalThis */ "./node_modules/engine.io-client/lib/globalThis.browser.js");

    var rNewline = /\n/g;
    var rEscapedNewline = /\\n/g;
    /**
     * Global JSONP callbacks.
     */

    var callbacks;

    var JSONPPolling = /*#__PURE__*/function (_Polling) {
      _inherits(JSONPPolling, _Polling);

      var _super = _createSuper(JSONPPolling);

      /**
       * JSONP Polling constructor.
       *
       * @param {Object} opts.
       * @api public
       */
      function JSONPPolling(opts) {
        var _this;

        _classCallCheck(this, JSONPPolling);

        _this = _super.call(this, opts);
        _this.query = _this.query || {}; // define global callbacks array if not present
        // we do this here (lazily) to avoid unneeded global pollution

        if (!callbacks) {
          // we need to consider multiple engines in the same page
          callbacks = globalThis.___eio = globalThis.___eio || [];
        } // callback identifier


        _this.index = callbacks.length; // add callback to jsonp global

        var self = _assertThisInitialized(_this);

        callbacks.push(function (msg) {
          self.onData(msg);
        }); // append to query string

        _this.query.j = _this.index;
        return _this;
      }
      /**
       * JSONP only supports binary as base64 encoded strings
       */


      _createClass(JSONPPolling, [{
        key: "doClose",

        /**
         * Closes the socket.
         *
         * @api private
         */
        value: function doClose() {
          if (this.script) {
            // prevent spurious errors from being emitted when the window is unloaded
            this.script.onerror = function () {};

            this.script.parentNode.removeChild(this.script);
            this.script = null;
          }

          if (this.form) {
            this.form.parentNode.removeChild(this.form);
            this.form = null;
            this.iframe = null;
          }

          _get(_getPrototypeOf(JSONPPolling.prototype), "doClose", this).call(this);
        }
        /**
         * Starts a poll cycle.
         *
         * @api private
         */

      }, {
        key: "doPoll",
        value: function doPoll() {
          var self = this;
          var script = document.createElement("script");

          if (this.script) {
            this.script.parentNode.removeChild(this.script);
            this.script = null;
          }

          script.async = true;
          script.src = this.uri();

          script.onerror = function (e) {
            self.onError("jsonp poll error", e);
          };

          var insertAt = document.getElementsByTagName("script")[0];

          if (insertAt) {
            insertAt.parentNode.insertBefore(script, insertAt);
          } else {
            (document.head || document.body).appendChild(script);
          }

          this.script = script;
          var isUAgecko = "undefined" !== typeof navigator && /gecko/i.test(navigator.userAgent);

          if (isUAgecko) {
            setTimeout(function () {
              var iframe = document.createElement("iframe");
              document.body.appendChild(iframe);
              document.body.removeChild(iframe);
            }, 100);
          }
        }
        /**
         * Writes with a hidden iframe.
         *
         * @param {String} data to send
         * @param {Function} called upon flush.
         * @api private
         */

      }, {
        key: "doWrite",
        value: function doWrite(data, fn) {
          var self = this;
          var iframe;

          if (!this.form) {
            var form = document.createElement("form");
            var area = document.createElement("textarea");
            var id = this.iframeId = "eio_iframe_" + this.index;
            form.className = "socketio";
            form.style.position = "absolute";
            form.style.top = "-1000px";
            form.style.left = "-1000px";
            form.target = id;
            form.method = "POST";
            form.setAttribute("accept-charset", "utf-8");
            area.name = "d";
            form.appendChild(area);
            document.body.appendChild(form);
            this.form = form;
            this.area = area;
          }

          this.form.action = this.uri();

          function complete() {
            initIframe();
            fn();
          }

          function initIframe() {
            if (self.iframe) {
              try {
                self.form.removeChild(self.iframe);
              } catch (e) {
                self.onError("jsonp polling iframe removal error", e);
              }
            }

            try {
              // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
              var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
              iframe = document.createElement(html);
            } catch (e) {
              iframe = document.createElement("iframe");
              iframe.name = self.iframeId;
              iframe.src = "javascript:0";
            }

            iframe.id = self.iframeId;
            self.form.appendChild(iframe);
            self.iframe = iframe;
          }

          initIframe(); // escape \n to prevent it from being converted into \r\n by some UAs
          // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side

          data = data.replace(rEscapedNewline, "\\\n");
          this.area.value = data.replace(rNewline, "\\n");

          try {
            this.form.submit();
          } catch (e) {}

          if (this.iframe.attachEvent) {
            this.iframe.onreadystatechange = function () {
              if (self.iframe.readyState === "complete") {
                complete();
              }
            };
          } else {
            this.iframe.onload = complete;
          }
        }
      }, {
        key: "supportsBinary",
        get: function get() {
          return false;
        }
      }]);

      return JSONPPolling;
    }(Polling);

    module.exports = JSONPPolling;

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/transports/polling-xhr.js":
    /*!*********************************************************************!*\
      !*** ./node_modules/engine.io-client/lib/transports/polling-xhr.js ***!
      \*********************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

    /* global attachEvent */
    var XMLHttpRequest = __webpack_require__(/*! ../../contrib/xmlhttprequest-ssl/XMLHttpRequest */ "./node_modules/engine.io-client/lib/xmlhttprequest.js");

    var Polling = __webpack_require__(/*! ./polling */ "./node_modules/engine.io-client/lib/transports/polling.js");

    var Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");

    var _require = __webpack_require__(/*! ../util */ "./node_modules/engine.io-client/lib/util.js"),
        pick = _require.pick;

    var globalThis = __webpack_require__(/*! ../globalThis */ "./node_modules/engine.io-client/lib/globalThis.browser.js");

    var debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("engine.io-client:polling-xhr");
    /**
     * Empty function
     */


    function empty() {}

    var hasXHR2 = function () {
      var xhr = new XMLHttpRequest({
        xdomain: false
      });
      return null != xhr.responseType;
    }();

    var XHR = /*#__PURE__*/function (_Polling) {
      _inherits(XHR, _Polling);

      var _super = _createSuper(XHR);

      /**
       * XHR Polling constructor.
       *
       * @param {Object} opts
       * @api public
       */
      function XHR(opts) {
        var _this;

        _classCallCheck(this, XHR);

        _this = _super.call(this, opts);

        if (typeof location !== "undefined") {
          var isSSL = "https:" === location.protocol;
          var port = location.port; // some user agents have empty `location.port`

          if (!port) {
            port = isSSL ? 443 : 80;
          }

          _this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
          _this.xs = opts.secure !== isSSL;
        }
        /**
         * XHR supports binary
         */


        var forceBase64 = opts && opts.forceBase64;
        _this.supportsBinary = hasXHR2 && !forceBase64;
        return _this;
      }
      /**
       * Creates a request.
       *
       * @param {String} method
       * @api private
       */


      _createClass(XHR, [{
        key: "request",
        value: function request() {
          var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

          _extends(opts, {
            xd: this.xd,
            xs: this.xs
          }, this.opts);

          return new Request(this.uri(), opts);
        }
        /**
         * Sends data.
         *
         * @param {String} data to send.
         * @param {Function} called upon flush.
         * @api private
         */

      }, {
        key: "doWrite",
        value: function doWrite(data, fn) {
          var req = this.request({
            method: "POST",
            data: data
          });
          var self = this;
          req.on("success", fn);
          req.on("error", function (err) {
            self.onError("xhr post error", err);
          });
        }
        /**
         * Starts a poll cycle.
         *
         * @api private
         */

      }, {
        key: "doPoll",
        value: function doPoll() {
          debug("xhr poll");
          var req = this.request();
          var self = this;
          req.on("data", function (data) {
            self.onData(data);
          });
          req.on("error", function (err) {
            self.onError("xhr poll error", err);
          });
          this.pollXhr = req;
        }
      }]);

      return XHR;
    }(Polling);

    var Request = /*#__PURE__*/function (_Emitter) {
      _inherits(Request, _Emitter);

      var _super2 = _createSuper(Request);

      /**
       * Request constructor
       *
       * @param {Object} options
       * @api public
       */
      function Request(uri, opts) {
        var _this2;

        _classCallCheck(this, Request);

        _this2 = _super2.call(this);
        _this2.opts = opts;
        _this2.method = opts.method || "GET";
        _this2.uri = uri;
        _this2.async = false !== opts.async;
        _this2.data = undefined !== opts.data ? opts.data : null;

        _this2.create();

        return _this2;
      }
      /**
       * Creates the XHR object and sends the request.
       *
       * @api private
       */


      _createClass(Request, [{
        key: "create",
        value: function create() {
          var opts = pick(this.opts, "agent", "enablesXDR", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
          opts.xdomain = !!this.opts.xd;
          opts.xscheme = !!this.opts.xs;
          var xhr = this.xhr = new XMLHttpRequest(opts);
          var self = this;

          try {
            debug("xhr open %s: %s", this.method, this.uri);
            xhr.open(this.method, this.uri, this.async);

            try {
              if (this.opts.extraHeaders) {
                xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);

                for (var i in this.opts.extraHeaders) {
                  if (this.opts.extraHeaders.hasOwnProperty(i)) {
                    xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                  }
                }
              }
            } catch (e) {}

            if ("POST" === this.method) {
              try {
                xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
              } catch (e) {}
            }

            try {
              xhr.setRequestHeader("Accept", "*/*");
            } catch (e) {} // ie6 check


            if ("withCredentials" in xhr) {
              xhr.withCredentials = this.opts.withCredentials;
            }

            if (this.opts.requestTimeout) {
              xhr.timeout = this.opts.requestTimeout;
            }

            if (this.hasXDR()) {
              xhr.onload = function () {
                self.onLoad();
              };

              xhr.onerror = function () {
                self.onError(xhr.responseText);
              };
            } else {
              xhr.onreadystatechange = function () {
                if (4 !== xhr.readyState) return;

                if (200 === xhr.status || 1223 === xhr.status) {
                  self.onLoad();
                } else {
                  // make sure the `error` event handler that's user-set
                  // does not throw in the same tick and gets caught here
                  setTimeout(function () {
                    self.onError(typeof xhr.status === "number" ? xhr.status : 0);
                  }, 0);
                }
              };
            }

            debug("xhr data %s", this.data);
            xhr.send(this.data);
          } catch (e) {
            // Need to defer since .create() is called directly from the constructor
            // and thus the 'error' event can only be only bound *after* this exception
            // occurs.  Therefore, also, we cannot throw here at all.
            setTimeout(function () {
              self.onError(e);
            }, 0);
            return;
          }

          if (typeof document !== "undefined") {
            this.index = Request.requestsCount++;
            Request.requests[this.index] = this;
          }
        }
        /**
         * Called upon successful response.
         *
         * @api private
         */

      }, {
        key: "onSuccess",
        value: function onSuccess() {
          this.emit("success");
          this.cleanup();
        }
        /**
         * Called if we have data.
         *
         * @api private
         */

      }, {
        key: "onData",
        value: function onData(data) {
          this.emit("data", data);
          this.onSuccess();
        }
        /**
         * Called upon error.
         *
         * @api private
         */

      }, {
        key: "onError",
        value: function onError(err) {
          this.emit("error", err);
          this.cleanup(true);
        }
        /**
         * Cleans up house.
         *
         * @api private
         */

      }, {
        key: "cleanup",
        value: function cleanup(fromError) {
          if ("undefined" === typeof this.xhr || null === this.xhr) {
            return;
          } // xmlhttprequest


          if (this.hasXDR()) {
            this.xhr.onload = this.xhr.onerror = empty;
          } else {
            this.xhr.onreadystatechange = empty;
          }

          if (fromError) {
            try {
              this.xhr.abort();
            } catch (e) {}
          }

          if (typeof document !== "undefined") {
            delete Request.requests[this.index];
          }

          this.xhr = null;
        }
        /**
         * Called upon load.
         *
         * @api private
         */

      }, {
        key: "onLoad",
        value: function onLoad() {
          var data = this.xhr.responseText;

          if (data !== null) {
            this.onData(data);
          }
        }
        /**
         * Check if it has XDomainRequest.
         *
         * @api private
         */

      }, {
        key: "hasXDR",
        value: function hasXDR() {
          return typeof XDomainRequest !== "undefined" && !this.xs && this.enablesXDR;
        }
        /**
         * Aborts the request.
         *
         * @api public
         */

      }, {
        key: "abort",
        value: function abort() {
          this.cleanup();
        }
      }]);

      return Request;
    }(Emitter);
    /**
     * Aborts pending requests when unloading the window. This is needed to prevent
     * memory leaks (e.g. when using IE) and to ensure that no spurious error is
     * emitted.
     */


    Request.requestsCount = 0;
    Request.requests = {};

    if (typeof document !== "undefined") {
      if (typeof attachEvent === "function") {
        attachEvent("onunload", unloadHandler);
      } else if (typeof addEventListener === "function") {
        var terminationEvent = "onpagehide" in globalThis ? "pagehide" : "unload";
        addEventListener(terminationEvent, unloadHandler, false);
      }
    }

    function unloadHandler() {
      for (var i in Request.requests) {
        if (Request.requests.hasOwnProperty(i)) {
          Request.requests[i].abort();
        }
      }
    }

    module.exports = XHR;
    module.exports.Request = Request;

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/transports/polling.js":
    /*!*****************************************************************!*\
      !*** ./node_modules/engine.io-client/lib/transports/polling.js ***!
      \*****************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

    var Transport = __webpack_require__(/*! ../transport */ "./node_modules/engine.io-client/lib/transport.js");

    var parseqs = __webpack_require__(/*! parseqs */ "./node_modules/parseqs/index.js");

    var parser = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/lib/index.js");

    var yeast = __webpack_require__(/*! yeast */ "./node_modules/yeast/index.js");

    var debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("engine.io-client:polling");

    var Polling = /*#__PURE__*/function (_Transport) {
      _inherits(Polling, _Transport);

      var _super = _createSuper(Polling);

      function Polling() {
        _classCallCheck(this, Polling);

        return _super.apply(this, arguments);
      }

      _createClass(Polling, [{
        key: "doOpen",

        /**
         * Opens the socket (triggers polling). We write a PING message to determine
         * when the transport is open.
         *
         * @api private
         */
        value: function doOpen() {
          this.poll();
        }
        /**
         * Pauses polling.
         *
         * @param {Function} callback upon buffers are flushed and transport is paused
         * @api private
         */

      }, {
        key: "pause",
        value: function pause(onPause) {
          var self = this;
          this.readyState = "pausing";

          function pause() {
            debug("paused");
            self.readyState = "paused";
            onPause();
          }

          if (this.polling || !this.writable) {
            var total = 0;

            if (this.polling) {
              debug("we are currently polling - waiting to pause");
              total++;
              this.once("pollComplete", function () {
                debug("pre-pause polling complete");
                --total || pause();
              });
            }

            if (!this.writable) {
              debug("we are currently writing - waiting to pause");
              total++;
              this.once("drain", function () {
                debug("pre-pause writing complete");
                --total || pause();
              });
            }
          } else {
            pause();
          }
        }
        /**
         * Starts polling cycle.
         *
         * @api public
         */

      }, {
        key: "poll",
        value: function poll() {
          debug("polling");
          this.polling = true;
          this.doPoll();
          this.emit("poll");
        }
        /**
         * Overloads onData to detect payloads.
         *
         * @api private
         */

      }, {
        key: "onData",
        value: function onData(data) {
          var self = this;
          debug("polling got data %s", data);

          var callback = function callback(packet, index, total) {
            // if its the first message we consider the transport open
            if ("opening" === self.readyState && packet.type === "open") {
              self.onOpen();
            } // if its a close packet, we close the ongoing requests


            if ("close" === packet.type) {
              self.onClose();
              return false;
            } // otherwise bypass onData and handle the message


            self.onPacket(packet);
          }; // decode payload


          parser.decodePayload(data, this.socket.binaryType).forEach(callback); // if an event did not trigger closing

          if ("closed" !== this.readyState) {
            // if we got data we're not polling
            this.polling = false;
            this.emit("pollComplete");

            if ("open" === this.readyState) {
              this.poll();
            } else {
              debug('ignoring poll - transport state "%s"', this.readyState);
            }
          }
        }
        /**
         * For polling, send a close packet.
         *
         * @api private
         */

      }, {
        key: "doClose",
        value: function doClose() {
          var self = this;

          function close() {
            debug("writing close packet");
            self.write([{
              type: "close"
            }]);
          }

          if ("open" === this.readyState) {
            debug("transport open - closing");
            close();
          } else {
            // in case we're trying to close while
            // handshaking is in progress (GH-164)
            debug("transport not open - deferring close");
            this.once("open", close);
          }
        }
        /**
         * Writes a packets payload.
         *
         * @param {Array} data packets
         * @param {Function} drain callback
         * @api private
         */

      }, {
        key: "write",
        value: function write(packets) {
          var _this = this;

          this.writable = false;
          parser.encodePayload(packets, function (data) {
            _this.doWrite(data, function () {
              _this.writable = true;

              _this.emit("drain");
            });
          });
        }
        /**
         * Generates uri for connection.
         *
         * @api private
         */

      }, {
        key: "uri",
        value: function uri() {
          var query = this.query || {};
          var schema = this.opts.secure ? "https" : "http";
          var port = ""; // cache busting is forced

          if (false !== this.opts.timestampRequests) {
            query[this.opts.timestampParam] = yeast();
          }

          if (!this.supportsBinary && !query.sid) {
            query.b64 = 1;
          }

          query = parseqs.encode(query); // avoid port if default for schema

          if (this.opts.port && ("https" === schema && Number(this.opts.port) !== 443 || "http" === schema && Number(this.opts.port) !== 80)) {
            port = ":" + this.opts.port;
          } // prepend ? to query


          if (query.length) {
            query = "?" + query;
          }

          var ipv6 = this.opts.hostname.indexOf(":") !== -1;
          return schema + "://" + (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) + port + this.opts.path + query;
        }
      }, {
        key: "name",

        /**
         * Transport name.
         */
        get: function get() {
          return "polling";
        }
      }]);

      return Polling;
    }(Transport);

    module.exports = Polling;

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/transports/websocket-constructor.browser.js":
    /*!***************************************************************************************!*\
      !*** ./node_modules/engine.io-client/lib/transports/websocket-constructor.browser.js ***!
      \***************************************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    var globalThis = __webpack_require__(/*! ../globalThis */ "./node_modules/engine.io-client/lib/globalThis.browser.js");

    module.exports = {
      WebSocket: globalThis.WebSocket || globalThis.MozWebSocket,
      usingBrowserWebSocket: true,
      defaultBinaryType: "arraybuffer"
    };

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/transports/websocket.js":
    /*!*******************************************************************!*\
      !*** ./node_modules/engine.io-client/lib/transports/websocket.js ***!
      \*******************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

    var Transport = __webpack_require__(/*! ../transport */ "./node_modules/engine.io-client/lib/transport.js");

    var parser = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/lib/index.js");

    var parseqs = __webpack_require__(/*! parseqs */ "./node_modules/parseqs/index.js");

    var yeast = __webpack_require__(/*! yeast */ "./node_modules/yeast/index.js");

    var _require = __webpack_require__(/*! ../util */ "./node_modules/engine.io-client/lib/util.js"),
        pick = _require.pick;

    var _require2 = __webpack_require__(/*! ./websocket-constructor */ "./node_modules/engine.io-client/lib/transports/websocket-constructor.browser.js"),
        WebSocket = _require2.WebSocket,
        usingBrowserWebSocket = _require2.usingBrowserWebSocket,
        defaultBinaryType = _require2.defaultBinaryType;

    var debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("engine.io-client:websocket"); // detect ReactNative environment


    var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";

    var WS = /*#__PURE__*/function (_Transport) {
      _inherits(WS, _Transport);

      var _super = _createSuper(WS);

      /**
       * WebSocket transport constructor.
       *
       * @api {Object} connection options
       * @api public
       */
      function WS(opts) {
        var _this;

        _classCallCheck(this, WS);

        _this = _super.call(this, opts);
        _this.supportsBinary = !opts.forceBase64;
        return _this;
      }
      /**
       * Transport name.
       *
       * @api public
       */


      _createClass(WS, [{
        key: "doOpen",

        /**
         * Opens socket.
         *
         * @api private
         */
        value: function doOpen() {
          if (!this.check()) {
            // let probe timeout
            return;
          }

          var uri = this.uri();
          var protocols = this.opts.protocols; // React Native only supports the 'headers' option, and will print a warning if anything else is passed

          var opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");

          if (this.opts.extraHeaders) {
            opts.headers = this.opts.extraHeaders;
          }

          try {
            this.ws = usingBrowserWebSocket && !isReactNative ? protocols ? new WebSocket(uri, protocols) : new WebSocket(uri) : new WebSocket(uri, protocols, opts);
          } catch (err) {
            return this.emit("error", err);
          }

          this.ws.binaryType = this.socket.binaryType || defaultBinaryType;
          this.addEventListeners();
        }
        /**
         * Adds event listeners to the socket
         *
         * @api private
         */

      }, {
        key: "addEventListeners",
        value: function addEventListeners() {
          var _this2 = this;

          this.ws.onopen = function () {
            if (_this2.opts.autoUnref) {
              _this2.ws._socket.unref();
            }

            _this2.onOpen();
          };

          this.ws.onclose = this.onClose.bind(this);

          this.ws.onmessage = function (ev) {
            return _this2.onData(ev.data);
          };

          this.ws.onerror = function (e) {
            return _this2.onError("websocket error", e);
          };
        }
        /**
         * Writes data to socket.
         *
         * @param {Array} array of packets.
         * @api private
         */

      }, {
        key: "write",
        value: function write(packets) {
          var self = this;
          this.writable = false; // encodePacket efficient as it uses WS framing
          // no need for encodePayload

          var total = packets.length;
          var i = 0;
          var l = total;

          for (; i < l; i++) {
            (function (packet) {
              parser.encodePacket(packet, self.supportsBinary, function (data) {
                // always create a new object (GH-437)
                var opts = {};

                if (!usingBrowserWebSocket) {
                  if (packet.options) {
                    opts.compress = packet.options.compress;
                  }

                  if (self.opts.perMessageDeflate) {
                    var len = "string" === typeof data ? Buffer.byteLength(data) : data.length;

                    if (len < self.opts.perMessageDeflate.threshold) {
                      opts.compress = false;
                    }
                  }
                } // Sometimes the websocket has already been closed but the browser didn't
                // have a chance of informing us about it yet, in that case send will
                // throw an error


                try {
                  if (usingBrowserWebSocket) {
                    // TypeError is thrown when passing the second argument on Safari
                    self.ws.send(data);
                  } else {
                    self.ws.send(data, opts);
                  }
                } catch (e) {
                  debug("websocket closed before onclose event");
                }

                --total || done();
              });
            })(packets[i]);
          }

          function done() {
            self.emit("flush"); // fake drain
            // defer to next tick to allow Socket to clear writeBuffer

            setTimeout(function () {
              self.writable = true;
              self.emit("drain");
            }, 0);
          }
        }
        /**
         * Called upon close
         *
         * @api private
         */

      }, {
        key: "onClose",
        value: function onClose() {
          Transport.prototype.onClose.call(this);
        }
        /**
         * Closes socket.
         *
         * @api private
         */

      }, {
        key: "doClose",
        value: function doClose() {
          if (typeof this.ws !== "undefined") {
            this.ws.close();
            this.ws = null;
          }
        }
        /**
         * Generates uri for connection.
         *
         * @api private
         */

      }, {
        key: "uri",
        value: function uri() {
          var query = this.query || {};
          var schema = this.opts.secure ? "wss" : "ws";
          var port = ""; // avoid port if default for schema

          if (this.opts.port && ("wss" === schema && Number(this.opts.port) !== 443 || "ws" === schema && Number(this.opts.port) !== 80)) {
            port = ":" + this.opts.port;
          } // append timestamp to URI


          if (this.opts.timestampRequests) {
            query[this.opts.timestampParam] = yeast();
          } // communicate binary support capabilities


          if (!this.supportsBinary) {
            query.b64 = 1;
          }

          query = parseqs.encode(query); // prepend ? to query

          if (query.length) {
            query = "?" + query;
          }

          var ipv6 = this.opts.hostname.indexOf(":") !== -1;
          return schema + "://" + (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) + port + this.opts.path + query;
        }
        /**
         * Feature detection for WebSocket.
         *
         * @return {Boolean} whether this transport is available.
         * @api public
         */

      }, {
        key: "check",
        value: function check() {
          return !!WebSocket && !("__initialize" in WebSocket && this.name === WS.prototype.name);
        }
      }, {
        key: "name",
        get: function get() {
          return "websocket";
        }
      }]);

      return WS;
    }(Transport);

    module.exports = WS;

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/util.js":
    /*!***************************************************!*\
      !*** ./node_modules/engine.io-client/lib/util.js ***!
      \***************************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    module.exports.pick = function (obj) {
      for (var _len = arguments.length, attr = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        attr[_key - 1] = arguments[_key];
      }

      return attr.reduce(function (acc, k) {
        if (obj.hasOwnProperty(k)) {
          acc[k] = obj[k];
        }

        return acc;
      }, {});
    };

    /***/ }),

    /***/ "./node_modules/engine.io-client/lib/xmlhttprequest.js":
    /*!*************************************************************!*\
      !*** ./node_modules/engine.io-client/lib/xmlhttprequest.js ***!
      \*************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    // browser shim for xmlhttprequest module
    var hasCORS = __webpack_require__(/*! has-cors */ "./node_modules/has-cors/index.js");

    var globalThis = __webpack_require__(/*! ./globalThis */ "./node_modules/engine.io-client/lib/globalThis.browser.js");

    module.exports = function (opts) {
      var xdomain = opts.xdomain; // scheme must be same when usign XDomainRequest
      // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx

      var xscheme = opts.xscheme; // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
      // https://github.com/Automattic/engine.io-client/pull/217

      var enablesXDR = opts.enablesXDR; // XMLHttpRequest can be disabled on IE

      try {
        if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
          return new XMLHttpRequest();
        }
      } catch (e) {} // Use XDomainRequest for IE8 if enablesXDR is true
      // because loading bar keeps flashing when using jsonp-polling
      // https://github.com/yujiosaka/socke.io-ie8-loading-example


      try {
        if ("undefined" !== typeof XDomainRequest && !xscheme && enablesXDR) {
          return new XDomainRequest();
        }
      } catch (e) {}

      if (!xdomain) {
        try {
          return new globalThis[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
        } catch (e) {}
      }
    };

    /***/ }),

    /***/ "./node_modules/engine.io-parser/lib/commons.js":
    /*!******************************************************!*\
      !*** ./node_modules/engine.io-parser/lib/commons.js ***!
      \******************************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    var PACKET_TYPES = Object.create(null); // no Map = no polyfill

    PACKET_TYPES["open"] = "0";
    PACKET_TYPES["close"] = "1";
    PACKET_TYPES["ping"] = "2";
    PACKET_TYPES["pong"] = "3";
    PACKET_TYPES["message"] = "4";
    PACKET_TYPES["upgrade"] = "5";
    PACKET_TYPES["noop"] = "6";
    var PACKET_TYPES_REVERSE = Object.create(null);
    Object.keys(PACKET_TYPES).forEach(function (key) {
      PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
    });
    var ERROR_PACKET = {
      type: "error",
      data: "parser error"
    };
    module.exports = {
      PACKET_TYPES: PACKET_TYPES,
      PACKET_TYPES_REVERSE: PACKET_TYPES_REVERSE,
      ERROR_PACKET: ERROR_PACKET
    };

    /***/ }),

    /***/ "./node_modules/engine.io-parser/lib/decodePacket.browser.js":
    /*!*******************************************************************!*\
      !*** ./node_modules/engine.io-parser/lib/decodePacket.browser.js ***!
      \*******************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    var _require = __webpack_require__(/*! ./commons */ "./node_modules/engine.io-parser/lib/commons.js"),
        PACKET_TYPES_REVERSE = _require.PACKET_TYPES_REVERSE,
        ERROR_PACKET = _require.ERROR_PACKET;

    var withNativeArrayBuffer = typeof ArrayBuffer === "function";
    var base64decoder;

    if (withNativeArrayBuffer) {
      base64decoder = __webpack_require__(/*! base64-arraybuffer */ "./node_modules/engine.io-parser/node_modules/base64-arraybuffer/lib/base64-arraybuffer.js");
    }

    var decodePacket = function decodePacket(encodedPacket, binaryType) {
      if (typeof encodedPacket !== "string") {
        return {
          type: "message",
          data: mapBinary(encodedPacket, binaryType)
        };
      }

      var type = encodedPacket.charAt(0);

      if (type === "b") {
        return {
          type: "message",
          data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
        };
      }

      var packetType = PACKET_TYPES_REVERSE[type];

      if (!packetType) {
        return ERROR_PACKET;
      }

      return encodedPacket.length > 1 ? {
        type: PACKET_TYPES_REVERSE[type],
        data: encodedPacket.substring(1)
      } : {
        type: PACKET_TYPES_REVERSE[type]
      };
    };

    var decodeBase64Packet = function decodeBase64Packet(data, binaryType) {
      if (base64decoder) {
        var decoded = base64decoder.decode(data);
        return mapBinary(decoded, binaryType);
      } else {
        return {
          base64: true,
          data: data
        }; // fallback for old browsers
      }
    };

    var mapBinary = function mapBinary(data, binaryType) {
      switch (binaryType) {
        case "blob":
          return data instanceof ArrayBuffer ? new Blob([data]) : data;

        case "arraybuffer":
        default:
          return data;
        // assuming the data is already an ArrayBuffer
      }
    };

    module.exports = decodePacket;

    /***/ }),

    /***/ "./node_modules/engine.io-parser/lib/encodePacket.browser.js":
    /*!*******************************************************************!*\
      !*** ./node_modules/engine.io-parser/lib/encodePacket.browser.js ***!
      \*******************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    var _require = __webpack_require__(/*! ./commons */ "./node_modules/engine.io-parser/lib/commons.js"),
        PACKET_TYPES = _require.PACKET_TYPES;

    var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
    var withNativeArrayBuffer = typeof ArrayBuffer === "function"; // ArrayBuffer.isView method is not defined in IE10

    var isView = function isView(obj) {
      return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
    };

    var encodePacket = function encodePacket(_ref, supportsBinary, callback) {
      var type = _ref.type,
          data = _ref.data;

      if (withNativeBlob && data instanceof Blob) {
        if (supportsBinary) {
          return callback(data);
        } else {
          return encodeBlobAsBase64(data, callback);
        }
      } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
        if (supportsBinary) {
          return callback(data instanceof ArrayBuffer ? data : data.buffer);
        } else {
          return encodeBlobAsBase64(new Blob([data]), callback);
        }
      } // plain string


      return callback(PACKET_TYPES[type] + (data || ""));
    };

    var encodeBlobAsBase64 = function encodeBlobAsBase64(data, callback) {
      var fileReader = new FileReader();

      fileReader.onload = function () {
        var content = fileReader.result.split(",")[1];
        callback("b" + content);
      };

      return fileReader.readAsDataURL(data);
    };

    module.exports = encodePacket;

    /***/ }),

    /***/ "./node_modules/engine.io-parser/lib/index.js":
    /*!****************************************************!*\
      !*** ./node_modules/engine.io-parser/lib/index.js ***!
      \****************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    var encodePacket = __webpack_require__(/*! ./encodePacket */ "./node_modules/engine.io-parser/lib/encodePacket.browser.js");

    var decodePacket = __webpack_require__(/*! ./decodePacket */ "./node_modules/engine.io-parser/lib/decodePacket.browser.js");

    var SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text

    var encodePayload = function encodePayload(packets, callback) {
      // some packets may be added to the array while encoding, so the initial length must be saved
      var length = packets.length;
      var encodedPackets = new Array(length);
      var count = 0;
      packets.forEach(function (packet, i) {
        // force base64 encoding for binary packets
        encodePacket(packet, false, function (encodedPacket) {
          encodedPackets[i] = encodedPacket;

          if (++count === length) {
            callback(encodedPackets.join(SEPARATOR));
          }
        });
      });
    };

    var decodePayload = function decodePayload(encodedPayload, binaryType) {
      var encodedPackets = encodedPayload.split(SEPARATOR);
      var packets = [];

      for (var i = 0; i < encodedPackets.length; i++) {
        var decodedPacket = decodePacket(encodedPackets[i], binaryType);
        packets.push(decodedPacket);

        if (decodedPacket.type === "error") {
          break;
        }
      }

      return packets;
    };

    module.exports = {
      protocol: 4,
      encodePacket: encodePacket,
      encodePayload: encodePayload,
      decodePacket: decodePacket,
      decodePayload: decodePayload
    };

    /***/ }),

    /***/ "./node_modules/engine.io-parser/node_modules/base64-arraybuffer/lib/base64-arraybuffer.js":
    /*!*************************************************************************************************!*\
      !*** ./node_modules/engine.io-parser/node_modules/base64-arraybuffer/lib/base64-arraybuffer.js ***!
      \*************************************************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    /*
     * base64-arraybuffer
     * https://github.com/niklasvh/base64-arraybuffer
     *
     * Copyright (c) 2012 Niklas von Hertzen
     * Licensed under the MIT license.
     */
    (function (chars) {

      exports.encode = function (arraybuffer) {
        var bytes = new Uint8Array(arraybuffer),
            i,
            len = bytes.length,
            base64 = "";

        for (i = 0; i < len; i += 3) {
          base64 += chars[bytes[i] >> 2];
          base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
          base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
          base64 += chars[bytes[i + 2] & 63];
        }

        if (len % 3 === 2) {
          base64 = base64.substring(0, base64.length - 1) + "=";
        } else if (len % 3 === 1) {
          base64 = base64.substring(0, base64.length - 2) + "==";
        }

        return base64;
      };

      exports.decode = function (base64) {
        var bufferLength = base64.length * 0.75,
            len = base64.length,
            i,
            p = 0,
            encoded1,
            encoded2,
            encoded3,
            encoded4;

        if (base64[base64.length - 1] === "=") {
          bufferLength--;

          if (base64[base64.length - 2] === "=") {
            bufferLength--;
          }
        }

        var arraybuffer = new ArrayBuffer(bufferLength),
            bytes = new Uint8Array(arraybuffer);

        for (i = 0; i < len; i += 4) {
          encoded1 = chars.indexOf(base64[i]);
          encoded2 = chars.indexOf(base64[i + 1]);
          encoded3 = chars.indexOf(base64[i + 2]);
          encoded4 = chars.indexOf(base64[i + 3]);
          bytes[p++] = encoded1 << 2 | encoded2 >> 4;
          bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
          bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
        }

        return arraybuffer;
      };
    })("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");

    /***/ }),

    /***/ "./node_modules/has-cors/index.js":
    /*!****************************************!*\
      !*** ./node_modules/has-cors/index.js ***!
      \****************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    /**
     * Module exports.
     *
     * Logic borrowed from Modernizr:
     *
     *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
     */
    try {
      module.exports = typeof XMLHttpRequest !== 'undefined' && 'withCredentials' in new XMLHttpRequest();
    } catch (err) {
      // if XMLHttp support is disabled in IE then it will throw
      // when trying to create
      module.exports = false;
    }

    /***/ }),

    /***/ "./node_modules/ms/index.js":
    /*!**********************************!*\
      !*** ./node_modules/ms/index.js ***!
      \**********************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    /**
     * Helpers.
     */
    var s = 1000;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */

    module.exports = function (val, options) {
      options = options || {};

      var type = _typeof(val);

      if (type === 'string' && val.length > 0) {
        return parse(val);
      } else if (type === 'number' && isFinite(val)) {
        return options["long"] ? fmtLong(val) : fmtShort(val);
      }

      throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
    };
    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */


    function parse(str) {
      str = String(str);

      if (str.length > 100) {
        return;
      }

      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);

      if (!match) {
        return;
      }

      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();

      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y;

        case 'weeks':
        case 'week':
        case 'w':
          return n * w;

        case 'days':
        case 'day':
        case 'd':
          return n * d;

        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h;

        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m;

        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s;

        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;

        default:
          return undefined;
      }
    }
    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */


    function fmtShort(ms) {
      var msAbs = Math.abs(ms);

      if (msAbs >= d) {
        return Math.round(ms / d) + 'd';
      }

      if (msAbs >= h) {
        return Math.round(ms / h) + 'h';
      }

      if (msAbs >= m) {
        return Math.round(ms / m) + 'm';
      }

      if (msAbs >= s) {
        return Math.round(ms / s) + 's';
      }

      return ms + 'ms';
    }
    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */


    function fmtLong(ms) {
      var msAbs = Math.abs(ms);

      if (msAbs >= d) {
        return plural(ms, msAbs, d, 'day');
      }

      if (msAbs >= h) {
        return plural(ms, msAbs, h, 'hour');
      }

      if (msAbs >= m) {
        return plural(ms, msAbs, m, 'minute');
      }

      if (msAbs >= s) {
        return plural(ms, msAbs, s, 'second');
      }

      return ms + ' ms';
    }
    /**
     * Pluralization helper.
     */


    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
    }

    /***/ }),

    /***/ "./node_modules/parseqs/index.js":
    /*!***************************************!*\
      !*** ./node_modules/parseqs/index.js ***!
      \***************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */
    exports.encode = function (obj) {
      var str = '';

      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (str.length) str += '&';
          str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
        }
      }

      return str;
    };
    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */


    exports.decode = function (qs) {
      var qry = {};
      var pairs = qs.split('&');

      for (var i = 0, l = pairs.length; i < l; i++) {
        var pair = pairs[i].split('=');
        qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }

      return qry;
    };

    /***/ }),

    /***/ "./node_modules/parseuri/index.js":
    /*!****************************************!*\
      !*** ./node_modules/parseuri/index.js ***!
      \****************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    /**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */
    var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
    var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];

    module.exports = function parseuri(str) {
      var src = str,
          b = str.indexOf('['),
          e = str.indexOf(']');

      if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
      }

      var m = re.exec(str || ''),
          uri = {},
          i = 14;

      while (i--) {
        uri[parts[i]] = m[i] || '';
      }

      if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
      }

      uri.pathNames = pathNames(uri, uri['path']);
      uri.queryKey = queryKey(uri, uri['query']);
      return uri;
    };

    function pathNames(obj, path) {
      var regx = /\/{2,9}/g,
          names = path.replace(regx, "/").split("/");

      if (path.substr(0, 1) == '/' || path.length === 0) {
        names.splice(0, 1);
      }

      if (path.substr(path.length - 1, 1) == '/') {
        names.splice(names.length - 1, 1);
      }

      return names;
    }

    function queryKey(uri, query) {
      var data = {};
      query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
        if ($1) {
          data[$1] = $2;
        }
      });
      return data;
    }

    /***/ }),

    /***/ "./node_modules/socket.io-parser/dist/binary.js":
    /*!******************************************************!*\
      !*** ./node_modules/socket.io-parser/dist/binary.js ***!
      \******************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {


    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.reconstructPacket = exports.deconstructPacket = void 0;

    var is_binary_1 = __webpack_require__(/*! ./is-binary */ "./node_modules/socket.io-parser/dist/is-binary.js");
    /**
     * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
     *
     * @param {Object} packet - socket.io event packet
     * @return {Object} with deconstructed packet and list of buffers
     * @public
     */


    function deconstructPacket(packet) {
      var buffers = [];
      var packetData = packet.data;
      var pack = packet;
      pack.data = _deconstructPacket(packetData, buffers);
      pack.attachments = buffers.length; // number of binary 'attachments'

      return {
        packet: pack,
        buffers: buffers
      };
    }

    exports.deconstructPacket = deconstructPacket;

    function _deconstructPacket(data, buffers) {
      if (!data) return data;

      if (is_binary_1.isBinary(data)) {
        var placeholder = {
          _placeholder: true,
          num: buffers.length
        };
        buffers.push(data);
        return placeholder;
      } else if (Array.isArray(data)) {
        var newData = new Array(data.length);

        for (var i = 0; i < data.length; i++) {
          newData[i] = _deconstructPacket(data[i], buffers);
        }

        return newData;
      } else if (_typeof(data) === "object" && !(data instanceof Date)) {
        var _newData = {};

        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            _newData[key] = _deconstructPacket(data[key], buffers);
          }
        }

        return _newData;
      }

      return data;
    }
    /**
     * Reconstructs a binary packet from its placeholder packet and buffers
     *
     * @param {Object} packet - event packet with placeholders
     * @param {Array} buffers - binary buffers to put in placeholder positions
     * @return {Object} reconstructed packet
     * @public
     */


    function reconstructPacket(packet, buffers) {
      packet.data = _reconstructPacket(packet.data, buffers);
      packet.attachments = undefined; // no longer useful

      return packet;
    }

    exports.reconstructPacket = reconstructPacket;

    function _reconstructPacket(data, buffers) {
      if (!data) return data;

      if (data && data._placeholder) {
        return buffers[data.num]; // appropriate buffer (should be natural order anyway)
      } else if (Array.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
          data[i] = _reconstructPacket(data[i], buffers);
        }
      } else if (_typeof(data) === "object") {
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            data[key] = _reconstructPacket(data[key], buffers);
          }
        }
      }

      return data;
    }

    /***/ }),

    /***/ "./node_modules/socket.io-parser/dist/index.js":
    /*!*****************************************************!*\
      !*** ./node_modules/socket.io-parser/dist/index.js ***!
      \*****************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {


    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

    function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Decoder = exports.Encoder = exports.PacketType = exports.protocol = void 0;

    var Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");

    var binary_1 = __webpack_require__(/*! ./binary */ "./node_modules/socket.io-parser/dist/binary.js");

    var is_binary_1 = __webpack_require__(/*! ./is-binary */ "./node_modules/socket.io-parser/dist/is-binary.js");

    var debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("socket.io-parser");
    /**
     * Protocol version.
     *
     * @public
     */


    exports.protocol = 5;
    var PacketType;

    (function (PacketType) {
      PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
      PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
      PacketType[PacketType["EVENT"] = 2] = "EVENT";
      PacketType[PacketType["ACK"] = 3] = "ACK";
      PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
      PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
      PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
    })(PacketType = exports.PacketType || (exports.PacketType = {}));
    /**
     * A socket.io Encoder instance
     */


    var Encoder = /*#__PURE__*/function () {
      function Encoder() {
        _classCallCheck(this, Encoder);
      }

      _createClass(Encoder, [{
        key: "encode",

        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        value: function encode(obj) {
          debug("encoding packet %j", obj);

          if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
            if (is_binary_1.hasBinary(obj)) {
              obj.type = obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK;
              return this.encodeAsBinary(obj);
            }
          }

          return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */

      }, {
        key: "encodeAsString",
        value: function encodeAsString(obj) {
          // first is type
          var str = "" + obj.type; // attachments if we have them

          if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
            str += obj.attachments + "-";
          } // if we have a namespace other than `/`
          // we append it followed by a comma `,`


          if (obj.nsp && "/" !== obj.nsp) {
            str += obj.nsp + ",";
          } // immediately followed by the id


          if (null != obj.id) {
            str += obj.id;
          } // json data


          if (null != obj.data) {
            str += JSON.stringify(obj.data);
          }

          debug("encoded %j as %s", obj, str);
          return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */

      }, {
        key: "encodeAsBinary",
        value: function encodeAsBinary(obj) {
          var deconstruction = binary_1.deconstructPacket(obj);
          var pack = this.encodeAsString(deconstruction.packet);
          var buffers = deconstruction.buffers;
          buffers.unshift(pack); // add packet info to beginning of data list

          return buffers; // write all the buffers
        }
      }]);

      return Encoder;
    }();

    exports.Encoder = Encoder;
    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     */

    var Decoder = /*#__PURE__*/function (_Emitter) {
      _inherits(Decoder, _Emitter);

      var _super = _createSuper(Decoder);

      function Decoder() {
        _classCallCheck(this, Decoder);

        return _super.call(this);
      }
      /**
       * Decodes an encoded packet string into packet JSON.
       *
       * @param {String} obj - encoded packet
       */


      _createClass(Decoder, [{
        key: "add",
        value: function add(obj) {
          var packet;

          if (typeof obj === "string") {
            packet = this.decodeString(obj);

            if (packet.type === PacketType.BINARY_EVENT || packet.type === PacketType.BINARY_ACK) {
              // binary packet's json
              this.reconstructor = new BinaryReconstructor(packet); // no attachments, labeled binary but no binary data to follow

              if (packet.attachments === 0) {
                _get(_getPrototypeOf(Decoder.prototype), "emit", this).call(this, "decoded", packet);
              }
            } else {
              // non-binary full packet
              _get(_getPrototypeOf(Decoder.prototype), "emit", this).call(this, "decoded", packet);
            }
          } else if (is_binary_1.isBinary(obj) || obj.base64) {
            // raw binary data
            if (!this.reconstructor) {
              throw new Error("got binary data when not reconstructing a packet");
            } else {
              packet = this.reconstructor.takeBinaryData(obj);

              if (packet) {
                // received final buffer
                this.reconstructor = null;

                _get(_getPrototypeOf(Decoder.prototype), "emit", this).call(this, "decoded", packet);
              }
            }
          } else {
            throw new Error("Unknown type: " + obj);
          }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */

      }, {
        key: "decodeString",
        value: function decodeString(str) {
          var i = 0; // look up type

          var p = {
            type: Number(str.charAt(0))
          };

          if (PacketType[p.type] === undefined) {
            throw new Error("unknown packet type " + p.type);
          } // look up attachments if type binary


          if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
            var start = i + 1;

            while (str.charAt(++i) !== "-" && i != str.length) {}

            var buf = str.substring(start, i);

            if (buf != Number(buf) || str.charAt(i) !== "-") {
              throw new Error("Illegal attachments");
            }

            p.attachments = Number(buf);
          } // look up namespace (if any)


          if ("/" === str.charAt(i + 1)) {
            var _start = i + 1;

            while (++i) {
              var c = str.charAt(i);
              if ("," === c) break;
              if (i === str.length) break;
            }

            p.nsp = str.substring(_start, i);
          } else {
            p.nsp = "/";
          } // look up id


          var next = str.charAt(i + 1);

          if ("" !== next && Number(next) == next) {
            var _start2 = i + 1;

            while (++i) {
              var _c = str.charAt(i);

              if (null == _c || Number(_c) != _c) {
                --i;
                break;
              }

              if (i === str.length) break;
            }

            p.id = Number(str.substring(_start2, i + 1));
          } // look up json data


          if (str.charAt(++i)) {
            var payload = tryParse(str.substr(i));

            if (Decoder.isPayloadValid(p.type, payload)) {
              p.data = payload;
            } else {
              throw new Error("invalid payload");
            }
          }

          debug("decoded %s as %j", str, p);
          return p;
        }
      }, {
        key: "destroy",

        /**
         * Deallocates a parser's resources
         */
        value: function destroy() {
          if (this.reconstructor) {
            this.reconstructor.finishedReconstruction();
          }
        }
      }], [{
        key: "isPayloadValid",
        value: function isPayloadValid(type, payload) {
          switch (type) {
            case PacketType.CONNECT:
              return _typeof(payload) === "object";

            case PacketType.DISCONNECT:
              return payload === undefined;

            case PacketType.CONNECT_ERROR:
              return typeof payload === "string" || _typeof(payload) === "object";

            case PacketType.EVENT:
            case PacketType.BINARY_EVENT:
              return Array.isArray(payload) && payload.length > 0;

            case PacketType.ACK:
            case PacketType.BINARY_ACK:
              return Array.isArray(payload);
          }
        }
      }]);

      return Decoder;
    }(Emitter);

    exports.Decoder = Decoder;

    function tryParse(str) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return false;
      }
    }
    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     */


    var BinaryReconstructor = /*#__PURE__*/function () {
      function BinaryReconstructor(packet) {
        _classCallCheck(this, BinaryReconstructor);

        this.packet = packet;
        this.buffers = [];
        this.reconPack = packet;
      }
      /**
       * Method to be called when binary data received from connection
       * after a BINARY_EVENT packet.
       *
       * @param {Buffer | ArrayBuffer} binData - the raw binary data received
       * @return {null | Object} returns null if more binary data is expected or
       *   a reconstructed packet object if all buffers have been received.
       */


      _createClass(BinaryReconstructor, [{
        key: "takeBinaryData",
        value: function takeBinaryData(binData) {
          this.buffers.push(binData);

          if (this.buffers.length === this.reconPack.attachments) {
            // done with buffer list
            var packet = binary_1.reconstructPacket(this.reconPack, this.buffers);
            this.finishedReconstruction();
            return packet;
          }

          return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */

      }, {
        key: "finishedReconstruction",
        value: function finishedReconstruction() {
          this.reconPack = null;
          this.buffers = [];
        }
      }]);

      return BinaryReconstructor;
    }();

    /***/ }),

    /***/ "./node_modules/socket.io-parser/dist/is-binary.js":
    /*!*********************************************************!*\
      !*** ./node_modules/socket.io-parser/dist/is-binary.js ***!
      \*********************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {


    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.hasBinary = exports.isBinary = void 0;
    var withNativeArrayBuffer = typeof ArrayBuffer === "function";

    var isView = function isView(obj) {
      return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
    };

    var toString = Object.prototype.toString;
    var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
    var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
    /**
     * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
     *
     * @private
     */

    function isBinary(obj) {
      return withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)) || withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File;
    }

    exports.isBinary = isBinary;

    function hasBinary(obj, toJSON) {
      if (!obj || _typeof(obj) !== "object") {
        return false;
      }

      if (Array.isArray(obj)) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (hasBinary(obj[i])) {
            return true;
          }
        }

        return false;
      }

      if (isBinary(obj)) {
        return true;
      }

      if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
        return hasBinary(obj.toJSON(), true);
      }

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
          return true;
        }
      }

      return false;
    }

    exports.hasBinary = hasBinary;

    /***/ }),

    /***/ "./node_modules/yeast/index.js":
    /*!*************************************!*\
      !*** ./node_modules/yeast/index.js ***!
      \*************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {


    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split(''),
        length = 64,
        map = {},
        seed = 0,
        i = 0,
        prev;
    /**
     * Return a string representing the specified number.
     *
     * @param {Number} num The number to convert.
     * @returns {String} The string representation of the number.
     * @api public
     */

    function encode(num) {
      var encoded = '';

      do {
        encoded = alphabet[num % length] + encoded;
        num = Math.floor(num / length);
      } while (num > 0);

      return encoded;
    }
    /**
     * Return the integer value specified by the given string.
     *
     * @param {String} str The string to convert.
     * @returns {Number} The integer value represented by the string.
     * @api public
     */


    function decode(str) {
      var decoded = 0;

      for (i = 0; i < str.length; i++) {
        decoded = decoded * length + map[str.charAt(i)];
      }

      return decoded;
    }
    /**
     * Yeast: A tiny growing id generator.
     *
     * @returns {String} A unique id.
     * @api public
     */


    function yeast() {
      var now = encode(+new Date());
      if (now !== prev) return seed = 0, prev = now;
      return now + '.' + encode(seed++);
    } //
    // Map each character to its index.
    //


    for (; i < length; i++) {
      map[alphabet[i]] = i;
    } //
    // Expose the `yeast`, `encode` and `decode` functions.
    //


    yeast.encode = encode;
    yeast.decode = decode;
    module.exports = yeast;

    /***/ })

    /******/ });
    });
    //# sourceMappingURL=socket.io.js.map
    });

    var io = /*@__PURE__*/getDefaultExportFromCjs(socket_io);

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    const socket = io( {autoConnect: false} );

    var userdata = {
        username : '',
        roomID : ''
    };

    function toggleButton(id) {
        let el = document.getElementsByClassName('button-primary-positive');
        console.log('El', el);
        if(el.length !== 0) {
            el[0].classList.toggle('button-primary-positive');
        }
        el = document.getElementById(id);
        el.classList.toggle('button-primary-positive');
    }

    function setEstimation(estimation) {
        var el = document.getElementById(socket.id);
        el.innerHTML = estimation;
        console.log(el.style.color);
        socket.emit('estimated', estimation);
    }

    function setUserdata(username, roomID) {
        userdata.username = username;
        userdata.roomID = roomID;
        console.log('client', userdata);
        socket.connect();
        socket.emit('joinRoom', userdata);
    }

    function fillUserList(users) {
        let playerlist = document.getElementById('playerlist');
        playerlist.innerHTML = '';

        for(let i = 0; i < users.length; i++){
            let listRow = document.createElement('tr');
            let player = document.createElement('td');
            let estimation = document.createElement('td');
            player.appendChild(document.createTextNode(users[i].username));
            estimation.appendChild(document.createTextNode(users[i].estimation));
            estimation.classList.add('estimation');
            estimation.setAttribute("id", users[i].id);
            listRow.appendChild(player);
            listRow.appendChild(estimation);
            playerlist.appendChild(listRow);
        }
    }

    function copyToClipboard(content) {
        navigator.clipboard.writeText(content).then(function() {
            console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
        console.error('Async: Could not copy text: ', err);
        });
    }

    function checkRooms(roomID) {
        socket.emit('checkRoom', roomID);
    }

    function showBannermessage(message) {
        let oldBanner = document.getElementById('newBanner');
        if( oldBanner !== null || undefined ) {
            oldBanner.remove();
        }
        let bannerfield = document.getElementById('bannerfield');
        let banner = createBanner(message, 'newBanner');
        
        bannerfield.appendChild(banner);

        setTimeout(function(){
            newBanner.classList.add('banner-invisible');
        }, 2000);
    }

    function createBanner(message, id) {
        let newBanner = document.createElement('h4');
        newBanner.setAttribute('id', id);
        newBanner.appendChild(document.createTextNode(message));
        newBanner.classList.add('banner-red');
        setTimeout(function(){
            newBanner.classList.add('banner-visible');
        }, 20);
        return newBanner;
    }

    function revealEstimations() {
        let est = document.getElementsByClassName('estimation');
        //console.log('all esti', est);
        for(let i = 0; i < est.length; i++) {
            est[i].style.opacity = 1;
        }
    }

    function clearList() {
        let est = document.getElementsByClassName('estimation');
        //console.log('all esti', est);
        for(let i = 0; i < est.length; i++) {
            est[i].style.opacity = 0;
            est[i].innerHTML = '';
        }

        let button = document.getElementsByClassName('button-primary-positive');
        if(button[0] !== undefined) {
            button[0].classList.remove('button-primary-positive');
        }
        showBannermessage('Values reseted.');
    }

    function getTheme() {
        document.getElementById('themeStyle').setAttribute('href', localStorage.getItem('theme'));
        document.body.style.visibility = 'visible';
    }

    function leaveRoom() {
        socket.disconnect();
    }


    //////////////////////////////////////////////////////////////////////
    //socket communication////////////////////////////////////////////////
    socket.on('bannermessage', (message) => {
        showBannermessage(message);
    });

    socket.on('newRoom', (newRoom) => {
        userdata.roomID = newRoom;
        //Object.freeze(userdata);
        document.getElementById('roomID').innerHTML = userdata.roomID;
    });

    socket.on('validation', (validation) => {
        console.log('validation', validation);
        if ( validation === true ) {
            setLobby();
        }
        else {
            //el = document.getElementById("roomIDInput");
            //el.placeholder = "Please enter an existing room-id.";
            //el.value = "";
            alert('This room-id does not exist.');
        }
    });

    // Get room and users
    socket.on('roomUsers', ({ room, users }) => {
        document.getElementById('playerlist').innerHTML = '';
        fillUserList(users);
    });

    // Recieve Validation from another User
    socket.on('newEstimation', (user) => {
        console.log(user.estimation);
        document.getElementById(user.id).innerHTML = user.estimation;
    });

    socket.on('reveal', (foo) => {
        revealEstimations();
    });

    socket.on('emptyList', (foo) => {
        clearList();
    });

    exports.checkRooms = checkRooms;
    exports.copyToClipboard = copyToClipboard;
    exports.default = app;
    exports.getTheme = getTheme;
    exports.leaveRoom = leaveRoom;
    exports.setEstimation = setEstimation;
    exports.setUserdata = setUserdata;
    exports.showBannermessage = showBannermessage;
    exports.socket = socket;
    exports.toggleButton = toggleButton;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=bundle.js.map
