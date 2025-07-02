import { getSettingsByUserId } from '@/actions/user-settings';
import { auth } from '@/lib/auth';
import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async () => {
    // Provide a static locale, fetch a user setting,
    // read from `cookies()`, `headers()`, etc.
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    let locale = 'en';
    if (session && session.user) {
        const settings = await getSettingsByUserId(session.user.id);
        if (settings) locale = settings.lang;
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
