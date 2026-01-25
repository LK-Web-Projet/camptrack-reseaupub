import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming prisma client is initialized here
import { requireAuth } from '@/lib/middleware/authMiddleware'; // Corrected to requireAuth
import { typeIncidentCreateSchema, validateData } from '@/lib/validation/schemas';

export async function GET() {
  try {
    const typesIncident = await prisma.typeIncident.findMany();
    return NextResponse.json(typesIncident, { status: 200 });
  } catch (error) {
    console.error('Error fetching incident types:', error);
    return NextResponse.json({ message: 'Failed to fetch incident types.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req); // Corrected to requireAuth
    if (!authResult.ok) {
      return authResult.response; // Return the authentication error response
    }

    const body = await req.json();
    const validation = validateData(typeIncidentCreateSchema, body);

    if (!validation.success) {
      return NextResponse.json({ message: validation.error }, { status: 400 });
    }

    const { nom, description } = validation.data;

    const newTypeIncident = await prisma.typeIncident.create({
      data: {
        nom,
        description,
      },
    });

    return NextResponse.json(newTypeIncident, { status: 201 });
  } catch (error) {
    console.error('Error creating incident type:', error);
    return NextResponse.json({ message: 'Failed to create incident type.' }, { status: 500 });
  }
}
