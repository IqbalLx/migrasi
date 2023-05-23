<script lang="ts">
    import FormField from "$lib/components/FormField.svelte";

    let password = '';
    let confirmPassword = '';

    let preventSubmit = false
    let confirmPasswordNotMatch = false

    let form: FormData

    $: {
        confirmPasswordNotMatch = (confirmPassword.length >= password.length) && (password !== confirmPassword)
    
        if (confirmPasswordNotMatch) {
            preventSubmit = true
        } else {
            preventSubmit = false
        }
    }
</script>

<div class="min-h-screen py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 px-6 py-4 bg-white shadow-md rounded-lg login-box">
        <div>
            <h2 class="text-center text-3xl font-extrabold text-gray-900"><a href="/">Migrasi</a></h2>
        </div>
        <form action="?/register" method="POST">
            <div class="mt-8">
                <FormField type={"text"} name={"name"} label={"Name"} placeholder={"Enter your full name"} />
            </div>

            <div class="mt-4 relative">
                <FormField type={"name"} name={"email"} label={"Email"} placeholder={"Enter your valid email"} />
            </div>

            <div class="mt-4 relative">
                <FormField type={"password"} name={"password"} label={"Password"} placeholder={"Enter your password"} isSecure={true} bind:value={password}/>
            </div>

            <div class="mt-4 relative">
                <FormField type={"password"} name={"password"} label={"Confirm Password"} placeholder={"Enter your password (again)"} isSecure={true} bind:value={confirmPassword} noSubmit={true}/>
                {#if confirmPasswordNotMatch}
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label class="label">
                    <span class="label-text-alt text-red-600">Confirm password must match password</span>
                  </label>
                {/if}
            </div>

            {#if form && form.code !== 200}
            <div class="toast toast-top">
                <div class="alert alert-error">
                  <div>
                    <span>{form.message}</span>
                  </div>
                </div>
              </div>
            {:else if form && form.success}
            <div class="toast toast-top">
                <div class="alert alert-success">
                  <div>
                    <span>Register success</span>
                  </div>
                </div>
              </div>
            {/if}

            <div class="mt-6">
            <button
                disabled={preventSubmit}
                type="submit"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white btn"
            >
                Register
            </button>
            </div>
            <div class="mt-4">
                <p class="text-center text-sm text-gray-600">Already have an account? <a href="/auth/login" class="text-indigo-600 hover:text-indigo-500 font-medium">Login Instead</a></p>
            </div>
            
        </form>
    </div>
</div>

<style>
    .login-box {
        max-width: 450px;
        margin: auto;
      }
</style>