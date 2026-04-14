import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import Highlight from "@tiptap/extension-highlight";

const lowlight = createLowlight(common);

interface NoteViewerProps {
    content?: string;
}

export const NoteViewer = ({ content }: NoteViewerProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ codeBlock: false }),
            Image,
            Underline,
            TextStyle,
            Color,
            Link.configure({
                openOnClick: true,
                HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" }
            }),
            CodeBlockLowlight.configure({ lowlight }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Highlight.configure({ multicolor: true })
        ],
        content,
        editable: false,
    });

    return <EditorContent editor={editor} />;
};