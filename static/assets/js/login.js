const email = document.getElementById('email'),
    password = document.getElementById('password'),
    login_button = document.getElementById('login_button');


const server_URL = 'http://127.0.0.1:55255/api'

login_button.addEventListener('click', function () {
    // console.log(firstname)

    const data = {

        email: email.value,
        password: password.value,

    }

    var config = {
        method: 'post',
        url: `${server_URL}/auth/login`,
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

})