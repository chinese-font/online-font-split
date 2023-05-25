export const asyncLock =
    (opt?: { notice?: () => void }) =>
    <T extends (...args: any[]) => Promise<any>>(
        _: Object,
        __: string | symbol,
        descriptor: TypedPropertyDescriptor<T>
    ): TypedPropertyDescriptor<T> => {
        const old = descriptor.value!;
        let lock = false;
        /** @ts-ignore */
        descriptor.value = async function (...args: any[]) {
            if (lock) return opt?.notice?.apply(this);
            lock = true;
            return old.apply(this, args).then((res) => {
                lock = false;
                return res;
            });
        };
        return descriptor;
    };
