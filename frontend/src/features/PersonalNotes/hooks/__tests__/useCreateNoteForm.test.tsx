import { renderHook, act } from "@testing-library/react";
import { useCreateNoteForm } from "../useCreateNoteForm";

import { renderHookWithStore } from "@/test-utils/renderWithStore";

describe("validation", () => {
    let result: ReturnType<typeof renderHookWithStore<ReturnType<typeof useCreateNoteForm>>>["result"];

    beforeEach(() => {
        ({ result } = renderHookWithStore(() =>
            useCreateNoteForm({
                setShowDiscardWarning: vi.fn(),
                closeModal: vi.fn(),
            })
        ));
    });

    it("fails validation when title is empty", () => {
        act(() => {
            result.current.form.setFieldValue("title", "");
            result.current.form.validate();
        });
        expect(result.current.form.errors.title).toBe("Please give your note a title.");
    });

    it("fails validation when title is whitespace only", () => {
        act(() => {
            result.current.form.setFieldValue("title", "   ");
            result.current.form.validate();
        });
        expect(result.current.form.errors.title).toBe("Please give your note a title.");
    });

    it("fails validation when body is empty", () => {
        act(() => {
            result.current.form.setFieldValue("body", "");
            result.current.form.validate();
        });

        expect(result.current.form.errors.body).toBe("Please give your note some content.");
    })

    it("fails validation when body is <p></p> only", () => {
        act(() => {
            result.current.form.setFieldValue("body", "<p></p>");
            result.current.form.validate();
        })

        expect(result.current.form.errors.body).toBe("Please give your note some content.");
    })
});