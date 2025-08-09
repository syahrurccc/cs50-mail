document.addEventListener('DOMContentLoaded', function() {

	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', compose_email);
	document.querySelector('#emails-view').addEventListener('click', function(event) {
		const entry = event.target.closest('.email-lists');
		if (entry) {
			show_email(entry);
		}
	});
	document.querySelector('.reply-email').addEventListener('click', function(event) {
		const entry = event.currentTarget;
		if (entry) {
			reply_email(entry);
		}
	});
	document.querySelector('.archive-email').addEventListener('click', function(event) {
		event.stopPropagation()
		const entry = event.currentTarget;
		if (entry) {
			archive_email(entry)
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

	document.querySelector('#compose-submit').addEventListener('click', () => {
		const recipients = document.querySelector('#compose-recipients').value;
		const subject = document.querySelector('#compose-subject').value;
		const body = document.querySelector('#compose-body').value;

		fetch('/emails', {
			method: 'POST',
			body: JSON.stringify({
				recipients: recipients,
				subject: subject,
				body: body
			})
			})
			.then(response => response.json())
			.then(result => {
				console.log(result);
			});

		return false
	});
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
				<span class="email-sender">${email.sender}</span>
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
			<span class="email-sender">From: ${email.sender}</span>
			<span class="email-timestamp">${email.timestamp}</span>`;

		const content = document.createElement('p');
		content.textContent = email.body;
		const emailView = document.querySelector('#email-content')
		emailView.append(subject, details, content);

		document.querySelector('.reply-email').setAttribute('id', entry.id);

		const archive = document.querySelector('.archive-email')
		if (email.archived) {
			archive.classList.add('archived', 'btn-outline-danger');
			archive.innerHTML = 'Unarchive'
		} else {
			archive.classList.add('unarchived', 'btn-outline-warning');
			archive.innerHTML = 'Archive'
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
		console.log(email)
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

function archive_email(entry) {

	const isArchived = entry.classList.contains('archived')
	if (isArchived) {
		entry.classList.remove('archived', 'btn-outline-danger');
		entry.classList.add('unarchived', 'btn-outline-warning');
		entry.innerHTML = 'Archive'
	} else {
		entry.classList.remove('unarchived', 'btn-outline-warning');
		entry.classList.add('archived', 'btn-outline-danger');
		entry.innerHTML = 'Unarchive'
	}

	fetch(`/emails/${entry.id}`, {
		method: 'PUT',
		body: JSON.stringify({archived: !isArchived})
	});
}
	