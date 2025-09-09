<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import '../app.postcss';
    import Nav from '../components/nav.svelte';
    
    // Floating UI for Popups (if using Skeleton popups)
    import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
    import { storePopup } from '@skeletonlabs/skeleton';
    
    storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<Nav />

<main class="container mx-auto p-4">
    <slot />
</main>