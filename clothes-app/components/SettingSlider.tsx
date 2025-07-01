import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';

export function SettingSlider({
    children,
    value,
    setValue,
    min = 0,
    max = 1,
    step = 0.01,
}: {
    children: React.ReactNode;
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    min: number;
    max: number;
    step: number;
}) {
    return (
        <div className="w-full flex space-x-2 place-items-center">
            <label className="mb-1">{children}</label>
            <Slider
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={(v) => {
                    setValue(v[0]);
                }}
                className="w-full"
            />
            <span>{value.toFixed(1)}</span>
        </div>
    );
}

export function SettingCheckbox({
    children,
    value,
    setValue,
}: {
    children: React.ReactNode;
    value: boolean;
    setValue: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    return (
        <div className="w-full flex justify-between place-items-center">
            <label className="mb-1">{children}</label>
            <Checkbox
                checked={value}
                onCheckedChange={(checked) => {
                    setValue(checked == true);
                }}
            />
        </div>
    );
}

export function SettingTextArea({
    children,
    value,
    setValue,
}: {
    children: React.ReactNode;
    value: boolean;
    setValue: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    return (
        <div className="w-full flex justify-between place-items-center">
            <label className="mb-1">{children}</label>
            <Checkbox
                checked={value}
                onCheckedChange={(checked) => {
                    setValue(checked == true);
                }}
            />
        </div>
    );
}

function FormArea({
    name,
    value,
    min,
    max,
    setColorValue,
}: {
    name: string;
    value: number;
    min: number;
    max: number;
    setColorValue: React.Dispatch<React.SetStateAction<{ L: number; a: number; b: number }>>;
}) {
    return (
        //</div>
        <div className="w-full flex space-x-3 place-items-center m-2">
            <label className="w-15">{name}</label>
            <input
                className=" bg-neutral-400 w-40 pl-1"
                type="number"
                min={min}
                max={max}
                name={name}
                value={value || ''}
                onChange={(event) => {
                    const inputValue = Math.max(min, Math.min(max, Number(event.target.value)));
                    setColorValue((values) => ({
                        ...values,
                        [event.target.name]: inputValue,
                    }));
                }}
            />
        </div>
    );
}

export function ColorSettingForm({
    value,
    setValue,
}: {
    value: { L: number; a: number; b: number };
    setValue: React.Dispatch<React.SetStateAction<{ L: number; a: number; b: number }>>;
}) {
    //const handleSubmit = (event) => {
    //    event.preventDefault();
    //    console.log(value);
    //};

    return (
        //<form onSubmit={handleSubmit}>
        <form>
            <FormArea name="L" value={value.L} min={0} max={100} setColorValue={setValue} />
            <FormArea name="a" value={value.a} min={-128} max={127} setColorValue={setValue} />
            <FormArea name="b" value={value.b} min={-128} max={127} setColorValue={setValue} />
            {/*<input type="submit" />*/}
        </form>
    );
}
