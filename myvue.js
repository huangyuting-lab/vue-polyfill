const targetMap = new WeakMap();
let activeEffect = null;

function track(target, key) {
  console.log("start track", target, key);
  if (!activeEffect) {
    return;
  }
  console.log("start real track", target, key);
  let depsMap = targetMap.get(target);
  !depsMap && targetMap.set(target, (depsMap = new Map()));
  let dep = depsMap.get(key);
  !dep && depsMap.set(key, (dep = new Set()));
  dep.add(activeEffect);
}

function trigger(target, key) {
  console.log("start trigger", target, key);
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(key);
  if (!dep) {
    return;
  }
  dep.forEach((effect) => {
    effect();
  });
}

function reactive(target) {
  console.log("start reactive");
  const handler = {
    get(target, key, receiver) {
      console.log("start reactive get", target, key);
      let result = Reflect.get(target, key, receiver);
      track(target, key);
      return result;
    },
    set(target, key, value, receiver) {
      console.log("start reactive set", target, key, value);
      let oldValue = target[key];
      let result = Reflect.set(target, key, value, receiver);
      if (result && oldValue != value) {
        trigger(target, key);
      }
      return result;
    },
  };
  return new Proxy(target, handler);
}

function ref(raw) {
  console.log("start ref");
  const r = {
    get value() {
      console.log("start ref get", r, raw);
      track(r, "value");
      return raw;
    },
    set value(newVal) {
      console.log("start ref set", r, raw, newVal);
      raw = newVal;
      trigger(r, "value");
    },
  };
  return r;
}

function effect(eff) {
  console.log("start activeEffect");
  activeEffect = eff;
  activeEffect();
  activeEffect = null;
}

let product = reactive({ price: 5, quantity: 2 });
let salePrice = ref(0);
let total = 0;

effect(() => {
  console.log("start effect salePrice");
  salePrice.value = product.price * 0.9;
  console.log("end effect salePrice", salePrice.value);
});
effect(() => {
  console.log("start effect total");
  total = salePrice.value * product.quantity;
  console.log("end effect total", total);
});

console.log(
  `Before updated total (should be 9) = ${total} salePrice (should be 4.5) = ${salePrice.value}`
);

product.quantity = 3;
console.log(
  `After updated quantity, total (should be 13.5) = ${total} salePrice (should be 4.5) = ${salePrice.value}`
);

product.price = 10;
console.log(
  `After updated price, total (should be 27) = ${total} salePrice (should be 9) = ${salePrice.value}`
);

console.log("end");
