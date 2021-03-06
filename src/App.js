import React, { useState, useEffect } from 'react';
import './App.css';
import { API, inputLabel, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
  /*  fetchNotes(); */
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <div className="App">
      <h1>Oral Screening</h1>
      Student id:  
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Enter Student Id"
        value={formData.name}
      />
      Student Name: 
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Enter Student Name"
        value={formData.description}
      />
      
      <h4>Left Teeth:
      <input
        type="file"
        onChange={onChange}
      />
      </h4>

      <h4>Right Teeth:
      <input 
        type = "file"
        onChange={onChange}
      />
      </h4>

      <h4>Bottom Teeth:
      <input 
        type = "file"
        onChange={onChange}
      />
      </h4>

      <h4>Top Teeth:
      <input 
        type = "file"
        onChange={onChange}
      />
      </h4>


      <button onClick={createNote}>Submit</button>
     
      <button onClick={fetchNotes}>Retrieve Images</button> 
     

      <div style={{marginBottom: 30}}>
        {
          notes.map(note => (
            <div key={note.id || note.name}>
              {note.name} {note.description}
              <button onClick={() => deleteNote(note)}>Delete Image</button>
              {
                note.image && <img src={note.image} style={{width: 400}} />
              }  
            </div>
          ))
        }
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
