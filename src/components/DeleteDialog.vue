<template>
  <!-- This just provides the actual dialog to the app -->
  <ConfirmDialog />
</template>

<script>
import ConfirmDialog from "primevue/confirmdialog";

export default {
  name: "DeleteDialog",
  components: { ConfirmDialog },
};
</script>
