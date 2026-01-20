import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { incidentCreateSchema, validateData } from '@/lib/validation/schemas';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import { handleApiError } from '@/lib/utils/errorHandler'; // Import handleApiError

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.ok) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const prestataireId = searchParams.get('prestataireId');

    const incidents = await prisma.incident.findMany({
      where: prestataireId ? { id_prestataire: prestataireId } : {},
      include: {
        type_incident: true, // Include the related TypeIncident
        photos: true,        // Include the related IncidentPhoto
      },
      orderBy: {
        date_incident: 'desc', // Order by most recent incident
      },
    });

    return NextResponse.json(incidents, { status: 200 });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return handleApiError(error); // Use handleApiError for consistent response
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.ok) {
      return authResult.response; // Return the authentication error response
    }

    const body = await req.json();
    const validation = validateData(incidentCreateSchema, body);

    if (!validation.success) {
      return NextResponse.json({ message: validation.error }, { status: 400 });
    }

    const { id_prestataire, id_type_incident, date_incident, commentaire, photos } = validation.data;

    const newIncident = await prisma.incident.create({
      data: {
        id_prestataire,
        id_type_incident,
        date_incident: new Date(date_incident), // Ensure date is correctly parsed
        commentaire,
        photos: {
          create: photos ? photos.map((url: string) => ({ url })) : [],
        },
      },
      include: {
        photos: true,
      },
    });

    return NextResponse.json(newIncident, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return handleApiError(error); // Use handleApiError for consistent response
  }
}
