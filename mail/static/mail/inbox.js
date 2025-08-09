document.addEventListener('DOMContentLoaded', function() {

	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', compose_email);
	document.querySelector('#compose-form').addEventListener('submit', send_email);
	document.querySelector('#emails-view').addEventListener('click', function(event) {
		const entry = event.target.closest('.email-lists');
		if (entry) {
			show_email(entry);
		}
	});
	document.querySelector('#view-email').addEventListener('click', function(event) {
		const replyBtn = event.target.closest('.reply-email')
		if (replyBtn) {
			reply_email(replyBtn);
		}
		
		const archiveBtn = event.target.closest('.archive-email')
		if (archiveBtn) {
			archive_email(archiveBtn);
		}
	});

	// By default, load the inbox
	load_mailbox('inbox');
});


function compose_email() {

	// Show compose view and hide other views
	document.querySelector('#view-email').style.display = 'none';
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';

	// Clear out composition fields
	document.querySelector('#compose-recipients').value = '';
	document.querySelector('#compose-subject').value = '';
	document.querySelector('#compose-body').value = '';
}
	

function load_mailbox(mailbox) {
  
	// Show the mailbox and hide other views
	document.querySelector('#emails-view').style.display = 'block';
	document.querySelector('#compose-view').style.display = 'none';
	document.querySelector('#view-email').style.display = 'none';

	// Show the mailbox name
	document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

	fetch(`/emails/${mailbox}`)
	.then(response => response.json())
	.then(emails => {
		emails.forEach(email => {	
			const div = document.createElement('div');
			div.setAttribute("id", email.id);
			div.setAttribute("class", "email-lists");
			if (email.read) {
				 div.classList.add("read");
			} 
			div.innerHTML = `
				<span class="email-addresses"><b>${email.sender}</b></span>
				<span class="email-subject">${email.subject}</span>
				<span class="email-timestamp">${email.timestamp}</span>`;
			document.querySelector('#emails-view').append(div);
		});
	});
}


function show_email(entry) {

	document.querySelector('#view-email').style.display = 'block';
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'none';

	document.querySelector('#email-content').innerHTML = '';

	fetch(`/emails/${entry.id}`)
	.then(response => response.json())
	.then(email => {
		console.log(email);
		const subject = document.createElement('h3');
		subject.textContent = email.subject;

		const details = document.createElement('div');
		details.setAttribute('class', 'email-details');
		details.innerHTML = `
			<div class="email-addresses">
				<div><b>From:</b> ${email.sender}</div>
				<div><b>To:</b> ${email.recipients.join(', ')}</div>
			</div>
			<div class="email-timestamp">${email.timestamp}</div>`;

		const content = document.createElement('p');
		content.setAttribute('class', 'email-body');
		content.textContent = email.body;
		content.style.whiteSpace = 'pre-wrap'; // Treat \n as line breaks
		const emailView = document.querySelector('#email-content')
		emailView.append(subject, details, content);

		document.querySelector('.reply-email').setAttribute('id', entry.id);

		const archive = document.querySelector('.archive-email')
		// Set archive button color and text
		if (email.archived) {
			archive.classList.add('archived', 'btn-outline-danger');
			archive.textContent = 'Unarchive';
		} else {
			archive.classList.add('unarchived', 'btn-outline-warning');
			archive.textContent = 'Archive';
		}
		archive.setAttribute('id', entry.id);
	});
	
	fetch(`/emails/${entry.id}`, {
		method: 'PUT',
		body: JSON.stringify({read: true})
	});
}


function reply_email(entry) {

	document.querySelector('#view-email').style.display = 'none';
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';

	fetch(`/emails/${entry.id}`)
	.then(response => response.json())
	.then(email => {
		// Pre-fill the fields
		document.querySelector('#compose-recipients').value = email.sender;

		let subject = email.subject;
		if (!subject.toLowerCase().startsWith("re:")) {
			subject = "Re: " + subject;
		}
		document.querySelector('#compose-subject').value = subject;

		const body = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n\n${email.body}`
		document.querySelector('#compose-body').value = body;
	});
}


function send_email(event) {

	// Prevent reloading after submit
	event.preventDefault();

	const recipients = document.querySelector('#compose-recipients').value;
	const subject = document.querySelector('#compose-subject').value;
	const body = document.querySelector('#compose-body').value;

	fetch('/emails', {
		method: 'POST',
		body: JSON.stringify({recipients, subject, body})
	})
	.then(response => response.json())
	.then(result => {
		// Redirect to sent page
		load_mailbox('sent')
		// Show success/error message
		const alert = document.createElement('div');
		alert.classList.add('alert', result.message ? 'alert-success' : 'alert-danger');
		alert.setAttribute('role', 'alert');
		alert.textContent = result.message || result.error
		document.querySelector('#emails-view').prepend(alert);
		// Remove message after 3 seconds
		setTimeout(() => alert.remove(), 3000);
	});
}


function archive_email(entry) {

	// Get the current state of the button, either archived or unarchived, return bool
	const isArchived = entry.classList.contains('archived')

	// Switch the class to archived and danger(red) IF isArchived is false
	// Otherwise do the other thing
	// The state now SWITCHED
	entry.classList.toggle('archived', !isArchived);
	entry.classList.toggle('btn-outline-danger', !isArchived);
	entry.classList.toggle('unarchived', isArchived);
	entry.classList.toggle('btn-outline-warning', isArchived);
	
	// Change the text to archive if the pre-clicked state is archive, else unarchive
	// Because the toggle switches the class of the button it is now the opposite state
	// isArchive is still based on the pre-click class so it lines up
	entry.textContent = isArchived ? 'Archive':'Unarchive';

	fetch(`/emails/${entry.id}`, {
		method: 'PUT',
		body: JSON.stringify({archived: !isArchived})
	});
}


	