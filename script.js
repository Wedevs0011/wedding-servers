const registrationForm = document.getElementById('registrationForm');
const rsvpReply = document.getElementById('rsvpReply');
const rsvpResult = document.getElementById('rsvpResult');


function rsvp() {
    const attendeename = document.getElementById('username').value;
    const loginn = document.getElementById('login');
    const register = document.getElementById('registration');

    loginn.style.display = 'block';
    register.style.display = 'none';


    fetch('http://localhost:7000/rsvp', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: attendeename}),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('names recieved',);
      rsvpReply.innerHTML = `<p>Thanks for rsvp-ing <strong>${data}</strong>! see you soon!</p>`;
    })
    .catch(error => {
      console.error('Error during registration:', error);
    });
  }
  

function dashboard() {

//get method to fetch all names from the database
  fetch ('http://localhost:7000/dashboard')

  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('names recieved');
    rsvpResult.innerHTML = `<p>Names:<strong>${data}</strong></p>`;
  })
  .catch(error => {
    console.error('Error during dashboard retrieval:', error);
  });
}

