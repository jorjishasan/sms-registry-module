import { NextResponse } from "next/server";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { checkIsLate, isPastDeadline } from "@/lib/calculations";
import {
  contentTypeForExtension,
  removeStoredSubmission,
  storeSubmissionFile,
} from "@/lib/submission-storage";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const assessmentId = String(formData.get("assessmentId") ?? "");
    const studentId = String(formData.get("studentId") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "File is required" },
        { status: 400 },
      );
    }

    if (!assessmentId || !studentId) {
      return NextResponse.json(
        { success: false, message: "Assessment and student are required" },
        { status: 400 },
      );
    }

    const extension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { success: false, message: "Only .pdf and .docx files are accepted" },
        { status: 400 },
      );
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, message: "Assessment not found" },
        { status: 404 },
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 },
      );
    }

    const serverNow = new Date();
    const existing = await prisma.submission.findUnique({
      where: {
        assessmentId_studentId: { assessmentId, studentId },
      },
    });

    if (existing && isPastDeadline(serverNow, assessment.deadline)) {
      return NextResponse.json(
        {
          success: false,
          message: "Resubmission blocked after the deadline",
        },
        { status: 409 },
      );
    }

    const safeBase = `${student.studentId}-${assessment.moduleCode}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    const fileName = `${safeBase}${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await storeSubmissionFile(
      fileName,
      buffer,
      contentTypeForExtension(extension),
    );
    const isLate = checkIsLate(serverNow, assessment.deadline);

    if (existing && existing.fileUrl !== fileUrl) {
      await removeStoredSubmission(existing.fileUrl);
    }

    const submission = await prisma.submission.upsert({
      where: {
        assessmentId_studentId: { assessmentId, studentId },
      },
      create: {
        assessmentId,
        studentId,
        fileName,
        fileUrl,
        submittedAt: serverNow,
        isLate,
      },
      update: {
        fileName,
        fileUrl,
        submittedAt: serverNow,
        isLate,
      },
    });

    return NextResponse.json({
      success: true,
      message: isLate
        ? "Submission accepted and flagged as late"
        : "Submission uploaded successfully",
      submission,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      assessmentId?: string;
      studentId?: string;
    };
    const assessmentId = String(body.assessmentId ?? "");
    const studentId = String(body.studentId ?? "");

    if (!assessmentId || !studentId) {
      return NextResponse.json(
        { success: false, message: "Assessment and student are required" },
        { status: 400 },
      );
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { deadline: true },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, message: "Assessment not found" },
        { status: 404 },
      );
    }

    if (isPastDeadline(new Date(), assessment.deadline)) {
      return NextResponse.json(
        {
          success: false,
          message: "Submission cannot be removed after the deadline",
        },
        { status: 409 },
      );
    }

    const existing = await prisma.submission.findUnique({
      where: {
        assessmentId_studentId: { assessmentId, studentId },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "No submission to remove" },
        { status: 404 },
      );
    }

    await prisma.submission.delete({
      where: { id: existing.id },
    });

    await removeStoredSubmission(existing.fileUrl);

    return NextResponse.json({
      success: true,
      message: "Submission removed",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Could not remove submission" },
      { status: 500 },
    );
  }
}
