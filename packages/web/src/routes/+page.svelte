<script lang="ts">
  import { page } from '$app/stores';
  import { trpc } from '@migrasi/shared/trpc/clients/web';

  let greeting = 'press the button to load data';
  let loading = false;

  const loadData = async () => {
    loading = true;
    greeting = await trpc($page).auth.greeting.query()
    loading = false;
  };

  $: { console.log(greeting)}

</script>

<h6>Loading data in<br /><code>+page.svelte</code></h6>

<a
  href="#load"
  role="button"
  class="secondary"
  aria-busy={loading}
  on:click|preventDefault={loadData}>Load</a
>
<p>{greeting}</p>

<section class="bg-white flex justify-center items-center min-h-screen">
    <div class="max-w-7xl py-16 px-4">
      <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
        <span class="block xl:inline">Migrate with</span>
        <span class="block xl:inline text-indigo-600">confidence!</span>
      </h1>
      <div class="mt-10">
        <a class="btn" href="/auth/register">Get Started Now</a>
        <a class="btn btn-link" href="/auth/login">or Logging In</a>
      </div>
    </div>
  </section>