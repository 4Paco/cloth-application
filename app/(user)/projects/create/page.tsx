'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { defineStepper } from '@stepperize/react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

const nameSchema = z.object({
    name: z.string().min(1, 'Please chose a project name'),
});

const paymentSchema = z.object({
    cardNumber: z.string().min(16, 'Card number is required'),
    expirationDate: z.string().min(5, 'Expiration date is required'),
    cvv: z.string().min(3, 'CVV is required'),
});

type NameFormValues = z.infer<typeof nameSchema>;
type PaymentFormValues = z.infer<typeof paymentSchema>;

const { useStepper, steps, utils } = defineStepper(
    { id: 'name', label: 'Name', schema: nameSchema },
    { id: 'payment', label: 'Payment', schema: paymentSchema },
    { id: 'summary', label: 'Complete', schema: z.object({}) }
);

export default function Page() {
    const stepper = useStepper();

    const form = useForm({
        mode: 'onTouched',
        resolver: zodResolver(stepper.current.schema),
    });

    const onSubmit = (values: z.infer<typeof stepper.current.schema>) => {
        console.log(`Form values for step ${stepper.current.id}:`, values);
        if (stepper.isLast) {
            stepper.reset();
        } else {
            stepper.next();
        }
    };

    const currentIndex = utils.getIndex(stepper.current.id);

    return (
        <div className="flex flex-col h-dvh w-dvw justify-center place-items-center">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <div className="flex flex-col justify-between items-start gap-1.5 px-6">
                            <div className="flex justify-between w-full">
                                <h2 className="text-lg font-medium">Checkout</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Step {currentIndex + 1} of {steps.length}
                                    </span>
                                </div>
                            </div>
                            <div className="group my-4 flex items-center justify-between gap-2">
                                {stepper.all.map((step, index, array) => (
                                    <React.Fragment key={step.id}>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <Button
                                                type="button"
                                                role="tab"
                                                variant={
                                                    index <= currentIndex ? 'default' : 'secondary'
                                                }
                                                aria-posinset={index + 1}
                                                aria-setsize={steps.length}
                                                aria-selected={stepper.current.id === step.id}
                                                className="flex size-10 items-center justify-center rounded-full"
                                                onClick={async () => {
                                                    const valid = await step.schema.safeParseAsync(
                                                        form.getValues()
                                                    );
                                                    // const valid = await form.trigger(step.fields);
                                                    //must be validated
                                                    if (!valid) return;
                                                    //can't skip steps forwards but can go back anywhere if validated
                                                    if (index - currentIndex > 0) return;
                                                    stepper.goTo(step.id);
                                                }}
                                            >
                                                {index + 1}
                                            </Button>
                                            <span className="text-sm font-medium">
                                                {step.label}
                                            </span>
                                        </div>
                                        {index < array.length - 1 && (
                                            <Separator
                                                className={`flex-1 ${
                                                    index < currentIndex ? 'bg-primary' : 'bg-muted'
                                                }`}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                        <CardContent className="w-full">
                            <div className="space-y-4 w-full">
                                {stepper.switch({
                                    name: () => <NameComponent />,
                                    payment: () => <PaymentComponent />,
                                    summary: () => <SummaryComponent />,
                                })}
                                {stepper.isLast ? (
                                    <div className="flex justify-end gap-4">
                                        <Button onClick={stepper.next}>
                                            {stepper.isLast ? 'Complete' : 'Next'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex justify-end gap-4">
                                        <Button
                                            variant="secondary"
                                            onClick={() => stepper.prev()}
                                            disabled={stepper.isFirst}
                                        >
                                            Back
                                        </Button>
                                        <Button onClick={() => stepper.next()}>
                                            {stepper.isLast ? 'Complete' : 'Next'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter></CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}

function NameComponent() {
    const {
        register,
        formState: { errors },
    } = useFormContext<NameFormValues>();

    return (
        <div className="space-y-4 text-start w-full">
            <div className="space-y-2">
                <label
                    htmlFor={register('name').name}
                    className="block text-sm font-medium text-primary"
                >
                    Project name
                </label>
                <Input
                    id={register('name').name}
                    {...register('name')}
                    className="block w-full p-2 border rounded-md"
                />
                {errors.name && (
                    <span className="text-sm text-destructive">{errors.name.message}</span>
                )}
            </div>
        </div>
    );
}

function PaymentComponent() {
    const {
        register,
        formState: { errors },
    } = useFormContext<PaymentFormValues>();

    return (
        <div className="space-y-4 text-start">
            <div className="space-y-2">
                <label
                    htmlFor={register('cardNumber').name}
                    className="block text-sm font-medium text-primary"
                >
                    Card Number
                </label>
                <Input
                    id={register('cardNumber').name}
                    {...register('cardNumber')}
                    className="block w-full p-2 border rounded-md"
                />
                {errors.cardNumber && (
                    <span className="text-sm text-destructive">{errors.cardNumber.message}</span>
                )}
            </div>
            <div className="space-y-2">
                <label
                    htmlFor={register('expirationDate').name}
                    className="block text-sm font-medium text-primary"
                >
                    Expiration Date
                </label>
                <Input
                    id={register('expirationDate').name}
                    {...register('expirationDate')}
                    className="block w-full p-2 border rounded-md"
                />
                {errors.expirationDate && (
                    <span className="text-sm text-destructive">
                        {errors.expirationDate.message}
                    </span>
                )}
            </div>
            <div className="space-y-2">
                <label
                    htmlFor={register('cvv').name}
                    className="block text-sm font-medium text-primary"
                >
                    CVV
                </label>
                <Input
                    id={register('cvv').name}
                    {...register('cvv')}
                    className="block w-full p-2 border rounded-md"
                />
                {errors.cvv && (
                    <span className="text-sm text-destructive">{errors.cvv.message}</span>
                )}
            </div>
        </div>
    );
}

function SummaryComponent() {
    return <div className="text-center">Here is the summary</div>;
}
