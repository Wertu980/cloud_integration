import { NextRequest, NextResponse } from "next/server";

const TARGET_BASE_URL = "https://api.cloud.mtos-org.site/api";

async function handleProxy(req: NextRequest, pathSegments: string[]) {
  try {
    const pathStr = pathSegments.join("/");
    const urlObj = new URL(req.url);
    let targetUrl = `${TARGET_BASE_URL}/${pathStr}${urlObj.search}`;

    if (pathSegments[0] === "auth") {
      targetUrl = `https://api.cloud.mtos-org.site/auth.php/api/auth/${pathSegments.slice(1).join("/")}${urlObj.search}`;
    }

    const headersToForward = new Headers();
    if (req.headers.has('authorization')) {
      headersToForward.set('authorization', req.headers.get('authorization')!);
    }
    if (req.headers.has('content-type')) {
      headersToForward.set('content-type', req.headers.get('content-type')!);
    }

    let body: ArrayBuffer | undefined = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.arrayBuffer();
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headersToForward,
      body: body,
    });

    const responseHeaders = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('content-type', contentType);
    }

    const resBody = await response.arrayBuffer();

    return new NextResponse(resBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: error.message || "Proxy connection error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path || []);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path || []);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path || []);
}
