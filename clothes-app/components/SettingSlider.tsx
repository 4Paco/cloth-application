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
