import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const url = req.nextUrl.pathname;

    if (url.startsWith('/auth') || url.startsWith('/public')) {
        return NextResponse.next();
    }

    if (!session) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    runtime: 'nodejs',
    matcher: ['/dashboard', '/projects', '/project/:path*'],
};
