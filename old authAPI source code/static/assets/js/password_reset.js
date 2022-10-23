const reset_code_btn = document.getElementById('send_password_reset_token'),
    confirm_reset_btn = document.getElementById('confirm_reset');

// const email = document.getElementById('email'),
//     new_password = document.getElementById('new_password'),
//     pass_reset_code = document.getElementById('password_reset_code'),

const server_URL = 'http://127.0.0.1:55255/api'

reset_code_btn.addEventListener('click', async function () {
    // console.log(firstname)
    const email = document.getElementById('email').value
    const access_token = await axios.post(server_URL + '/auth/password/reset', { email })
        .then((response) => {
            console.log(response)
            if (response.status == 200 || 201) {
                window.alert('success')
            } else {
                window.alert(response.message)
            }
            
            return response.data.token
        }, (error) => {
            window.alert(error.data.message)
        }).catch((error) => {
            console.log(error)
            windows.alert(error)
        })
    
    window.localStorage.setItem('access_token', access_token);
})


confirm_reset_btn.addEventListener('click', async function () {
    let access_token = window.localStorage.getItem('access_token');

    const new_password = document.getElementById('new_password').value,
        reset_token = document.getElementById('password_reset_code').value;

    await axios.post(server_URL + '/auth/password/confirmtoken',
        { reset_token, password: new_password },
        {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        },)
        .then((response) => {
            console.log(response)
            if (response.status == 200 || 201) {
                window.alert('success')
            } else {
                window.alert(response.message)
            }
            return response
        }, (error) => {
            window.alert(error.message)
        }).catch((error) => {
            console.log(error)
            windows.alert(error)
        })
})