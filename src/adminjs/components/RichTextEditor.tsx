import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="adminjs_MenuBar" style={{ borderBottom: '1px solid #ccc', padding: '5px', marginBottom: '5px' }}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        style={{ fontWeight: editor.isActive('bold') ? 'bold' : 'normal', margin: '0 2px' }}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        style={{ fontStyle: editor.isActive('italic') ? 'italic' : 'normal', margin: '0 2px' }}
      >
        Italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        style={{ fontWeight: editor.isActive('heading', { level: 1 }) ? 'bold' : 'normal', margin: '0 2px' }}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        style={{ fontWeight: editor.isActive('heading', { level: 2 }) ? 'bold' : 'normal', margin: '0 2px' }}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={{ fontWeight: editor.isActive('bulletList') ? 'bold' : 'normal', margin: '0 2px' }}
      >
        Bullet List
      </button>
    </div>
  )
}

const RichTextEditor = (props: any) => {
  const { property, record, onChange } = props
  const value = record.params[property.name]

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(property.name, editor.getHTML())
    },
  })

  return (
    <div style={{ marginBottom: '20px', border: '1px solid #ccc', borderRadius: '4px', padding: '5px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{property.label}</label>
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        style={{
            minHeight: '200px',
            padding: '10px',
            outline: 'none'
        }}
      />
    </div>
  )
}

export default RichTextEditor
