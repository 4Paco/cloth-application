'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';

const formSchema = z.object({
    lang: z.string(),
});

export default function UserSettings({
    onFinish,
    children,
}: {
    onFinish: () => void;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const settings = useSettings();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            lang: settings?.lang ?? 'no lang found',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setOpen(false);
        onFinish();
    }
    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) {
                    onFinish();
                }
                setOpen(v);
            }}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a project</DialogTitle>
                    <DialogDescription asChild>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <FormField
                                    control={form.control}
                                    name="lang"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Language</FormLabel>
                                            <FormControl>
                                                <Input placeholder="fr" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                The language of the interface
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit">Update settings</Button>
                            </form>
                        </Form>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
