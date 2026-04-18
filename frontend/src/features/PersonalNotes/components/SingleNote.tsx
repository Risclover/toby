import type { PersonalNote } from "@/store"
import { getLightColor } from "@/utils/getLightColor";
import { Box, Text, Tooltip, Transition } from "@mantine/core";
import { useState } from "react";
import { FaGlobeAmericas } from "react-icons/fa";
import { FaLock } from "react-icons/fa6";
import { IoLockClosedOutline } from "react-icons/io5";
import { BiLockOpenAlt } from "react-icons/bi";
import { SlLock } from "react-icons/sl";
import { HiLockClosed } from "react-icons/hi2";
import { IoLockClosed } from "react-icons/io5";
import { BiSolidLockAlt } from "react-icons/bi";
import { PadlockIcon } from "@/assets/icons/PadlockIcon";
import { GoLock } from "react-icons/go";

type Props = {
    note: PersonalNote;
    onNoteClick: (val: string) => void;
}

const parseNoteContent = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const images = Array.from(doc.querySelectorAll("img")).map(img => img.src);
    doc.querySelectorAll("img").forEach(img => img.remove());

    // Add a space after every block element so text doesn't run together
    doc.querySelectorAll("p, h1, h2, h3, h4, li, blockquote").forEach(el => {
        el.textContent = el.textContent + " ";
    });

    const text = doc.body.innerText.replace(/\s+/g, " ").trim();

    return { text, images };
};

export const SingleNote = ({ note, onNoteClick }: Props) => {
    const [mountReadBtn, setMountReadBtn] = useState(false);
    const { text, images } = parseNoteContent(note.body);

    const formatDate = (createdAt?: string): string => {
        const normalized = createdAt?.endsWith("Z") ? createdAt : createdAt + "Z";
        const diff = Math.floor((Date.now() - new Date(normalized!).getTime()) / 1000);
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return new Date(normalized!).toLocaleDateString();
    };

    console.log('NOTE:', note)

    return (
        <div className="single-note-container" style={{ borderTop: `5px solid ${note.category ? getLightColor(note.category?.color || "#000000", 1) : "transparent"}` }} onMouseEnter={() => setMountReadBtn(true)}
            onMouseLeave={() => setMountReadBtn(false)} onClick={() => onNoteClick(note.id)}>
            <div className="single-note-container-main">
                <div className="single-note-container-top">
                    {note.title && <div className="single-note-title">{note.title} {note.isPrivate ? <span className="single-note-visibility"><GoLock size="18px" color="var(--mantine-color-gray-6)" /></span> : null}</div>}
                    <div className="single-note-date-container">
                        Posted <span className="personal-note-date">{formatDate(note.createdAt)}</span> {note.updatedAt !== note.createdAt ? <><span className="date-dot">·</span> Last modified {formatDate(note.updatedAt)}</> : ""}
                    </div>
                </div>
                <div className="single-note-content">
                    <Text size="sm" lineClamp={3} c="black">{text}</Text>
                    {images.length > 0 && (
                        <div className="single-note-images">
                            {images.slice(0, 3).map((src, i) => (
                                <img key={i} src={src} className="single-note-image-thumb" alt="" />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {note.category && <div className="single-note-footer">
                <div className="single-note-footer-left">
                    {note.category && <div className="single-note-subheader">
                        {note.categoryId !== null && <div className="personal-note-category" style={{ background: getLightColor(note.category?.color || "#000000"), color: note.category?.color, }}>
                            {note.category?.name}
                        </div>
                        }</div>}
                </div>
                <Text size="sm" styles={{ root: { color: note.category?.color } }} className="single-note-footer-right">
                    Open
                </Text>

            </div>}
        </div >
    );
};

