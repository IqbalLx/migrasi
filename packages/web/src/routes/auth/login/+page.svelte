<script lang="ts">
    import FormField from "$lib/components/FormField.svelte";


    export let form: FormData
</script>

<div class="min-h-screen py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 px-6 py-4 bg-white shadow-md rounded-lg login-box">
        <div>
            <h2 class="text-center text-3xl font-extrabold text-gray-900">Migrasi</h2>
        </div>
        <form action="?/login" method="POST">
            <div class="mt-8">
                <FormField type={"email"} name={"email"} label={"Email"} placeholder={"Enter your registered email"}/>
            </div>
            <div class="mt-4 relative">
                <FormField type={"password"} name={"password"} label={"Password"} placeholder={"Enter your password"} isSecure={true}/>
            </div>

            {#if form && form.code !== 200}
            <div class="toast toast-top">
                <div class="alert alert-error">
                  <div>
                    <span>{form.message}</span>
                  </div>
                </div>
              </div>
            {/if}

            <div class="mt-6">
            <button
                type="submit"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white btn"
            >
                Sign In
            </button>
            </div>
            <div class="mt-4">
                <p class="text-center text-sm text-gray-600">Don't have an account? <a href="/auth/register" class="text-indigo-600 hover:text-indigo-500 font-medium">Register Today!</a></p>
                <p class="text-center text-sm text-gray-600 mt-1">Forgot your password? <span class="tooltip tooltip-bottom" data-tip="the service not ready yet lol"><a href="#" class="text-indigo-600 hover:text-indigo-500 font-medium">Please Remember It!</a></span></p>
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