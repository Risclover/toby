import type { PersonalNote } from "@/store"
import { Box, Text, Transition } from "@mantine/core";
import { useState } from "react";

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

    return (
        <div className="single-note-container" style={{ borderLeft: `4px solid ${note.color}` }} onMouseEnter={() => setMountReadBtn(true)}
            onMouseLeave={() => setMountReadBtn(false)} onClick={() => onNoteClick(note.id)}>
            {note.title && <div className="single-note-title">{note.title}</div>}
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
            <div className="single-note-footer">
                <div className="single-note-footer-left">
                    Posted <span className="personal-note-date">{formatDate(note.createdAt)}</span> {note.updatedAt !== note.createdAt ? <><span className="date-dot">·</span> Last modified {formatDate(note.updatedAt)}</> : ""}
                </div>


                <Transition
                    mounted={mountReadBtn}
                    transition="fade-left"
                    duration={100}
                    keepMounted
                >
                    {(styles) => (
                        <Text size="sm" style={styles} styles={{ root: { color: note.color } }} className="single-note-footer-right">
                            Open
                        </Text>
                    )}
                </Transition>
            </div>
        </div >
    );
};