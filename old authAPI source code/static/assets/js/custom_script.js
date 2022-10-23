const firstname = document.getElementById('fname'),
    lastname = document.getElementById('lname'),
    email = document.getElementById('email'),
    password = document.getElementById('password'),
    confirm_password = document.getElementById('confirm_password'),
    create_acc_button = document.getElementById('create_acc_button');


const check_inputs = (email_i, password_i, conf_password_i) => {
    let email_match = email_i.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    
    let password_match = password_i == conf_password_i
    console.log(email_match, password_match)
    return email_match && password_match
}


const server_URL = 'http://127.0.0.1:55255/api'

create_acc_button.addEventListener('click', function () {
    // console.log(firstname)
    let match = check_inputs(email.value, password.value, confirm_password.value)

    if (!match) { window.alert('Input format invalid,') }
    else {
        const data = {
            firstname: firstname.value,
            lastname: lastname.value,
            email: email.value,
            password: password.value,
            role: "EndUser"
        }

        var config = {
            method: 'post',
            url: `${server_URL}/auth/signup`,
            headers: {
                origin: 'http://127.0.0.1:5500',
                'Content-Type': 'application/json'
            },
            data
        };

        axios.post(config.url, config.data)
            .then((response) => {
                console.log(response)
                if (response.status == 200 || 201) {
                    window.alert('success')
                } else {
                    window.alert(response.message)
                }
            }, (error) => {
                window.alert(error.message)
            }).catch((error) => {
                console.log(error)
                windows.alert(error)
            })
    }

})